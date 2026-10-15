import { and, asc, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "@/db/connect";
import { dormViolationAppeals, dormViolations, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import { matchesSearch } from "./room-list";
import {
  ANNOUNCED_FIELDS,
  type AnnouncedViolation,
  APPEAL_OF_VIOLATION,
} from "./violation-announcement";
import {
  APPEAL_ACCEPTED,
  announcedBy,
  announcedToday,
  campusDayStart,
  escalatedBy,
  inAppealOrWaitingAt,
  inPeriodDays,
} from "./violation-conditions";
import { VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import type { PeriodDays } from "./violation-periods";

/** The three numbers at the top of the staff screen. */
export interface ViolationNumbers {
  /** Announced on today's campus day, up to now. */
  announcedToday: number;
  /** In Masa advokasi or Advokasi diproses now, whatever their day. */
  inAppeal: number;
  /** Gone up to Pengelola Asrama, of a violation day of the semester. */
  escalated: number;
}

/** One student of "Rekap pelanggaran per mahasiswa". */
export interface RekapRow {
  studentId: string;
  name: string;
  nim: string;
  /** The dorm of their latest violation of the semester. */
  dorm: DormId;
  /** Gone up to Pengelola Asrama: Tercatat. */
  escalated: number;
  /** In Masa advokasi or Advokasi diproses: Proses advokasi. */
  inAppeal: number;
  /** Advokasi diterima, which does not count. */
  accepted: number;
}

export interface Rekap {
  rows: RekapRow[];
  /** How many students the semester and the search hold. */
  matching: number;
  page: number;
}

/** One student's announced violations of the semester, for the box over the tab. */
export interface StudentViolations {
  studentId: string;
  name: string;
  nim: string;
  rows: AnnouncedViolation[];
  matching: number;
  page: number;
}

async function countWhere(db: Database, where: SQL | undefined) {
  const [counted] = await db
    .select({ amount: count() })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(where);
  return counted?.amount ?? 0;
}

/**
 * "Diumumkan hari ini", "Dalam masa advokasi", which holds Advokasi
 * diproses too, and "Naik ke Pengelola Asrama", of the students
 * `visible` holds, at `now` by the server's clock. The last counts the
 * violation days of the semester only.
 */
export async function readViolationNumbers(
  db: Database,
  visible: SQL,
  now: Date,
  semester: PeriodDays | null,
): Promise<ViolationNumbers> {
  const todayStart = campusDayStart(campusDay(now));
  const ofSemester = semester === null ? sql`false` : inPeriodDays(semester);
  const [today, appeal, escalated] = await Promise.all([
    countWhere(db, and(visible, announcedToday(now, todayStart))),
    countWhere(db, and(visible, inAppealOrWaitingAt(now))),
    countWhere(db, and(visible, escalatedBy(now), ofSemester)),
  ]);
  return { announcedToday: today, inAppeal: appeal, escalated };
}

function countOf(condition: SQL | undefined): SQL<number> {
  return sql<number>`(count(*) filter (where ${condition}))::int`;
}
const LATEST_DORM = sql<DormId>`(array_agg(${dormViolations.dorm} order by ${dormViolations.day} desc, ${dormViolations.announcedAt} desc))[1]`;

/**
 * "Rekap pelanggaran per mahasiswa": each student `visible` holds with an
 * announced violation on a day of the semester, whose name or NIM holds
 * the search text, with how many went up to Pengelola Asrama, how many
 * are in Masa advokasi or Advokasi diproses, and how many had their
 * appeal accepted. The most Tercatat first, then by name, 20 a page.
 */
export async function readViolationRekap(
  db: Database,
  visible: SQL,
  now: Date,
  semester: PeriodDays,
  query: string,
  page: number,
): Promise<Rekap> {
  const where = and(
    visible,
    announcedBy(now),
    inPeriodDays(semester),
    matchesSearch(query),
  );
  const [counted] = await db
    .select({
      matching: sql<number>`count(distinct ${dormViolations.studentId})::int`,
    })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(where);
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, VIOLATIONS_PAGE_SIZE);
  const escalated = countOf(escalatedBy(now));
  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      dorm: LATEST_DORM,
      escalated,
      inAppeal: countOf(inAppealOrWaitingAt(now)),
      accepted: countOf(APPEAL_ACCEPTED),
    })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(where)
    .groupBy(students.id)
    .orderBy(desc(escalated), asc(students.name), asc(students.nim))
    .limit(VIOLATIONS_PAGE_SIZE)
    .offset((shown - 1) * VIOLATIONS_PAGE_SIZE);
  return { rows, matching, page: shown };
}

/**
 * The announced violations of one student on the days of the semester,
 * the latest first, 20 a page. Null for a student `visible` does not hold,
 * or with no such violation: the box then does not open.
 */
export async function readStudentViolations(
  db: Database,
  visible: SQL,
  studentId: string,
  now: Date,
  semester: PeriodDays,
  page: number,
): Promise<StudentViolations | null> {
  const where = and(
    visible,
    eq(dormViolations.studentId, studentId),
    announcedBy(now),
    inPeriodDays(semester),
  );
  const matching = await countWhere(db, where);
  if (matching === 0) return null;
  const shown = pageWithin(page, matching, VIOLATIONS_PAGE_SIZE);
  const rows = await db
    .select(ANNOUNCED_FIELDS)
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .leftJoin(dormViolationAppeals, APPEAL_OF_VIOLATION)
    .where(where)
    .orderBy(
      desc(dormViolations.day),
      desc(dormViolations.announcedAt),
      asc(dormViolations.id),
    )
    .limit(VIOLATIONS_PAGE_SIZE)
    .offset((shown - 1) * VIOLATIONS_PAGE_SIZE);
  const [first] = rows;
  if (!first) return null;
  return {
    studentId,
    name: first.name,
    nim: first.nim,
    rows,
    matching,
    page: shown,
  };
}
