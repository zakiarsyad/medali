import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  ne,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  counsellingConsents,
  counsellingSchedules,
  counsellingSessions,
  counsellingSharings,
  students,
  studyPrograms,
} from "@/db/schema";
import { heldInLast30Days } from "@/mental-health/recent-sessions";
import {
  ACTIVE_STATUSES,
  type CounsellingHour,
  type ScheduleStatus,
} from "@/mental-health/schedule-ids";
import { pageWithin } from "@/ui/list-pages";
import {
  COUNSELLING_LIST_PAGE_SIZE,
  type CounsellingListParams,
} from "./counselling-list-address";
import type {
  CounsellingNumbers,
  CounsellingStudentList,
  CounsellingStudentRow,
} from "./counselling-list-view";
import { comingDay } from "./counselling-list-words";

/**
 * The students whose counselling the account may list, never the
 * account's own student; null for an account without the right, which is
 * then given nothing.
 */
export function counsellingListReachOf(actor: AccountForAccess): SQL | null {
  if (!may(actor.roles, "view_counselling_students")) return null;
  const visible = visibleTo(
    rowLimitForAction(actor, "view_counselling_students"),
  );
  if (actor.studentId === null) return visible;
  return and(visible, ne(students.id, actor.studentId)) ?? visible;
}

const HAS_SCHEDULE = sql`exists (
  select 1 from ${counsellingSchedules}
  where ${counsellingSchedules.studentId} = ${students.id}
)`;

const HAS_SESSION = sql`exists (
  select 1 from ${counsellingSessions}
  where ${counsellingSessions.studentId} = ${students.id}
)`;

/** A student with a consent record, a schedule or a session. */
const IN_LIST = or(
  sql`${counsellingConsents.id} is not null`,
  HAS_SCHEDULE,
  HAS_SESSION,
);

/** How many sessions of the student row were written down. */
export const SESSION_COUNT = sql<number>`(
  select count(*)::int from ${counsellingSessions}
  where ${counsellingSessions.studentId} = ${students.id}
)`;

/** "Sesi berikutnya" of the student row's latest session, passed or not. */
export const LATEST_NEXT_DAY = sql<string | null>`(
  select ${counsellingSessions.nextDay} from ${counsellingSessions}
  where ${counsellingSessions.studentId} = ${students.id}
  order by ${counsellingSessions.day} desc, ${counsellingSessions.writtenAt} desc,
    ${counsellingSessions.id} desc
  limit 1
)`;

function searched(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

/** The filter of "Daftar mahasiswa"; nothing for "Semua". */
function filtered(
  params: CounsellingListParams,
  today: string,
): SQL | undefined {
  if (params.filter === "waiting") {
    return eq(counsellingConsents.status, "waiting");
  }
  if (params.filter === "approved") {
    return eq(counsellingConsents.status, "approved");
  }
  if (params.filter === "next_session") {
    return sql`${LATEST_NEXT_DAY} >= ${today}`;
  }
  return undefined;
}

const shownSchedule = alias(counsellingSchedules, "shown_schedule");

/**
 * The student row's active schedule that comes soonest: by its time, one
 * with no time yet after those with one, then the first made. A student
 * may have a voluntary request and assignments beside it.
 */
const SOONEST_ACTIVE_SCHEDULE = sql`(
  select ${counsellingSchedules.id} from ${counsellingSchedules}
  where ${counsellingSchedules.studentId} = ${students.id}
    and ${inArray(counsellingSchedules.status, [...ACTIVE_STATUSES])}
  order by ${counsellingSchedules.day} asc nulls last,
    ${counsellingSchedules.hour} asc nulls last,
    ${counsellingSchedules.createdAt} asc, ${counsellingSchedules.id} asc
  limit 1
)`;

export const latestSharing = alias(counsellingSharings, "latest_sharing");

/** The student row's latest sharing, current or ended, as its panel shows. */
export const LATEST_SHARING = sql`(
  select ${counsellingSharings.id} from ${counsellingSharings}
  where ${counsellingSharings.studentId} = ${students.id}
  order by ${counsellingSharings.askedAt} desc, ${counsellingSharings.id} desc
  limit 1
)`;

/**
 * "Menunggu persetujuan" and "Sesi 30 hari terakhir" of every student
 * the account may list, for an account with the right; null, with
 * nothing read, for any other.
 */
export async function readCounsellingNumbers(
  db: Database,
  actor: AccountForAccess,
  now: Date = new Date(),
): Promise<CounsellingNumbers | null> {
  const reach = counsellingListReachOf(actor);
  if (reach === null) return null;
  const [waiting] = await db
    .select({ count: count() })
    .from(counsellingConsents)
    .innerJoin(students, eq(students.id, counsellingConsents.studentId))
    .where(and(reach, eq(counsellingConsents.status, "waiting")));
  const [recent] = await db
    .select({ count: count() })
    .from(counsellingSessions)
    .innerJoin(students, eq(students.id, counsellingSessions.studentId))
    .where(and(reach, heldInLast30Days(campusDay(now))));
  return {
    waitingConsent: waiting?.count ?? 0,
    recentSessions: recent?.count ?? 0,
  };
}

interface ReadRow extends Omit<CounsellingStudentRow, "nextDay" | "schedule"> {
  latestNextDay: string | null;
  scheduleStatus: ScheduleStatus | null;
  scheduleDay: string | null;
  scheduleHour: CounsellingHour | null;
}

function rowOf(read: ReadRow, today: string): CounsellingStudentRow {
  const { latestNextDay, scheduleStatus, scheduleDay, scheduleHour, ...rest } =
    read;
  const schedule =
    scheduleStatus === null
      ? null
      : { status: scheduleStatus, day: scheduleDay, hour: scheduleHour };
  return { ...rest, nextDay: comingDay(latestNextDay, today), schedule };
}

/**
 * One page of "Daftar mahasiswa": each student with a consent record, a
 * schedule or a session that matches the search and the filter, by
 * name. Each row holds only what the list shows, never the notes. Null,
 * with nothing read, for an account without the right.
 */
export async function readCounsellingList(
  db: Database,
  actor: AccountForAccess,
  params: CounsellingListParams,
  now: Date = new Date(),
): Promise<CounsellingStudentList | null> {
  const reach = counsellingListReachOf(actor);
  if (reach === null) return null;
  const today = campusDay(now);
  const where = and(
    reach,
    IN_LIST,
    searched(params.query),
    filtered(params, today),
  );
  const [found] = await db
    .select({ matching: count() })
    .from(students)
    .leftJoin(
      counsellingConsents,
      eq(counsellingConsents.studentId, students.id),
    )
    .where(where);
  const matching = found?.matching ?? 0;
  const page = pageWithin(params.page, matching, COUNSELLING_LIST_PAGE_SIZE);
  const rows: ReadRow[] = await db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      consent: counsellingConsents.status,
      sessions: SESSION_COUNT,
      latestNextDay: LATEST_NEXT_DAY,
      scheduleStatus: shownSchedule.status,
      scheduleDay: shownSchedule.day,
      scheduleHour: shownSchedule.hour,
      sharing: latestSharing.status,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(
      counsellingConsents,
      eq(counsellingConsents.studentId, students.id),
    )
    .leftJoin(shownSchedule, eq(shownSchedule.id, SOONEST_ACTIVE_SCHEDULE))
    .leftJoin(latestSharing, eq(latestSharing.id, LATEST_SHARING))
    .where(where)
    .orderBy(asc(students.name), asc(students.nim))
    .limit(COUNSELLING_LIST_PAGE_SIZE)
    .offset((page - 1) * COUNSELLING_LIST_PAGE_SIZE);
  return { rows: rows.map((row) => rowOf(row, today)), matching, page };
}
