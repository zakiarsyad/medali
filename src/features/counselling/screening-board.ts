import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  counsellingConsents,
  mentalHealthScreenings,
  students,
  studyPrograms,
} from "@/db/schema";
import { latestScreenings } from "@/mental-health/latest-screenings";
import { COUNSELLING_LEVELS } from "@/mental-health/screening-rules";
import { MENTOR_NAME } from "@/mentoring/mentor-name";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import {
  LATEST_NEXT_DAY,
  LATEST_SHARING,
  latestSharing,
  SESSION_COUNT,
} from "./counselling-list";
import { comingDay } from "./counselling-list-words";
import type { ScreeningParams } from "./screening-address";
import { screeningReachOf } from "./screening-reach";
import type {
  ScreeningList,
  ScreeningNumbers,
  ScreeningRow,
} from "./screening-view";

/** Each screened student's latest screening, with its "Risiko" mark. */
function latestWithRisk(db: Database) {
  return latestScreenings(db, { selfHarm: mentalHealthScreenings.selfHarm });
}

type Latest = ReturnType<typeof latestWithRisk>;

function needsCounselling(latest: Latest): SQL {
  return inArray(latest.level, [...COUNSELLING_LEVELS]);
}

const WAITS_FOR_CONSENT = eq(counsellingConsents.status, "waiting");

const HAS_CONSENT = eq(counsellingConsents.status, "approved");

/** The search and the filter of "Daftar mahasiswa". */
function chosen(latest: Latest, params: ScreeningParams): SQL | undefined {
  const conditions: SQL[] = [];
  if (params.query !== "") {
    const pattern = containsPattern(params.query);
    const found = or(
      ilike(students.name, pattern),
      ilike(students.nim, pattern),
    );
    if (found) conditions.push(found);
  }
  if (params.filter === "counselling")
    conditions.push(needsCounselling(latest));
  if (params.filter === "waiting") conditions.push(WAITS_FOR_CONSENT);
  if (params.filter === "approved") conditions.push(HAS_CONSENT);
  return and(...conditions);
}

/**
 * "Sudah diasesmen", "Perlu konseling" and "Menunggu persetujuan" of the
 * screened students, for an account with the right to record
 * screenings; null, with nothing read, for any other.
 */
export async function readScreeningNumbers(
  db: Database,
  actor: AccountForAccess,
): Promise<ScreeningNumbers | null> {
  const reach = screeningReachOf(actor);
  if (reach === null) return null;
  const latest = latestWithRisk(db);
  const [numbers] = await db
    .select({
      screened: count(),
      needCounselling: sql<number>`(count(*) filter (where ${needsCounselling(latest)}))::int`,
      waitingConsent: sql<number>`(count(*) filter (where ${WAITS_FOR_CONSENT}))::int`,
    })
    .from(latest)
    .innerJoin(students, eq(students.id, latest.studentId))
    .leftJoin(
      counsellingConsents,
      eq(counsellingConsents.studentId, latest.studentId),
    )
    .where(reach);
  if (!numbers) throw new Error("The numbers of the screenings were not read.");
  return numbers;
}

function rowOf(
  read: Omit<ScreeningRow, "nextDay"> & { latestNextDay: string | null },
  today: string,
): ScreeningRow {
  const { latestNextDay, ...rest } = read;
  return { ...rest, nextDay: comingDay(latestNextDay, today) };
}

/**
 * One page of "Daftar mahasiswa": each screened student that matches the
 * search and the filter, by their latest screening, the most serious
 * first, then by name, with the sessions and the latest sharing as the
 * list on Konseling shows them. Null, with nothing read, for an account
 * without the right to record screenings.
 */
export async function readScreeningList(
  db: Database,
  actor: AccountForAccess,
  params: ScreeningParams,
  now: Date = new Date(),
): Promise<ScreeningList | null> {
  const reach = screeningReachOf(actor);
  if (reach === null) return null;
  const latest = latestWithRisk(db);
  const where = and(reach, chosen(latest, params));
  const [found] = await db
    .select({ matching: count() })
    .from(latest)
    .innerJoin(students, eq(students.id, latest.studentId))
    .leftJoin(
      counsellingConsents,
      eq(counsellingConsents.studentId, latest.studentId),
    )
    .where(where);
  const matching = found?.matching ?? 0;
  const page = pageWithin(params.page, matching);
  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      mentorName: MENTOR_NAME,
      instrument: latest.instrument,
      screenedOn: latest.screenedOn,
      level: latest.level,
      risk: latest.selfHarm,
      consent: counsellingConsents.status,
      sessions: SESSION_COUNT,
      latestNextDay: LATEST_NEXT_DAY,
      sharing: latestSharing.status,
    })
    .from(latest)
    .innerJoin(students, eq(students.id, latest.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(
      counsellingConsents,
      eq(counsellingConsents.studentId, latest.studentId),
    )
    .leftJoin(latestSharing, eq(latestSharing.id, LATEST_SHARING))
    .where(where)
    .orderBy(desc(latest.level), asc(students.name), asc(students.nim))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
  const today = campusDay(now);
  return { rows: rows.map((row) => rowOf(row, today)), matching, page };
}
