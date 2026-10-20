import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { skpmRows, skpmUploads, students, studyPrograms } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { pageWithin } from "@/ui/list-pages";
import {
  SKPM_LIST_PAGE_SIZE,
  type SkpmFilter,
  type SkpmParams,
} from "./skpm-address";
import { oneDecimal, skpmScoreOf } from "./skpm-score";
import { countUploadsInForce, IN_FORCE, totalsByStudent } from "./skpm-totals";

/** The four numbers at the top of the tab, of the students the account sees. */
export interface SkpmNumbers {
  /** How many Aktif students the account sees. */
  students: number;
  /** How many of them have a row in force. */
  withData: number;
  /** The mean total points and the mean Nilai SKPM of those, or null. */
  meanPoints: number | null;
  meanScore: number | null;
  /** How many uploads count now. */
  uploads: number;
}

/** What a student with rows in force has; null for one without. */
export interface SkpmTotals {
  activities: number;
  total: number;
  score: number;
}

/** One student of "Nilai SKPM per mahasiswa". */
export interface SkpmListRow {
  id: string;
  name: string;
  nim: string;
  program: string;
  totals: SkpmTotals | null;
}

export interface SkpmList {
  rows: SkpmListRow[];
  /** How many students the filters let through, on every page. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

/** One activity of a student, as "Rincian" shows it. */
export interface SkpmActivity {
  id: string;
  activity: string;
  category: string;
  level: string | null;
  activityRole: string | null;
  day: string | null;
  points: number;
}

/** "Rincian": a student with every activity in force. */
export interface SkpmDetail {
  id: string;
  name: string;
  nim: string;
  program: string;
  totals: SkpmTotals | null;
  activities: SkpmActivity[];
}

/** The Aktif students among those `visible` lets through. */
function seen(visible: SQL): SQL | undefined {
  return and(visible, ACTIVE_MEMBER);
}

function totalsOf(
  row: { activities: number | null; total: number | null },
  pointsForHundred: number,
): SkpmTotals | null {
  if (row.activities === null || row.total === null) return null;
  return {
    activities: row.activities,
    total: row.total,
    score: skpmScoreOf(row.total, pointsForHundred),
  };
}

/**
 * The four numbers. The students with data are grouped by their total
 * in the database, so only a few rows leave it, and Nilai SKPM is worked
 * out here by the one rule.
 */
export async function readSkpmNumbers(
  db: Database,
  visible: SQL,
  pointsForHundred: number,
): Promise<SkpmNumbers> {
  const totals = totalsByStudent(db);
  const groups = await db
    .select({ total: totals.total, students: count() })
    .from(students)
    .leftJoin(totals, eq(totals.studentId, students.id))
    .where(seen(visible))
    .groupBy(totals.total);
  let all = 0;
  let withData = 0;
  let points = 0;
  let scores = 0;
  for (const group of groups) {
    all += group.students;
    if (group.total === null) continue;
    withData += group.students;
    points += group.total * group.students;
    scores += skpmScoreOf(group.total, pointsForHundred) * group.students;
  }
  const hasData = withData > 0;
  return {
    students: all,
    withData,
    meanPoints: hasData ? oneDecimal(points / withData) : null,
    meanScore: hasData ? oneDecimal(scores / withData) : null,
    uploads: await countUploadsInForce(db),
  };
}

function filterOf(
  totals: ReturnType<typeof totalsByStudent>,
  filter: SkpmFilter,
): SQL | undefined {
  switch (filter) {
    case "all":
      return undefined;
    case "with":
      return isNotNull(totals.studentId);
    case "without":
      return isNull(totals.studentId);
  }
}

function matching(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

/**
 * One page of "Nilai SKPM per mahasiswa": the Aktif students the account
 * sees who match the search and the filter, the most points first and
 * those without data last, then by name.
 */
export async function readSkpmList(
  db: Database,
  visible: SQL,
  pointsForHundred: number,
  params: Pick<SkpmParams, "query" | "filter" | "page">,
): Promise<SkpmList> {
  const totals = totalsByStudent(db);
  const where = and(
    seen(visible),
    matching(params.query),
    filterOf(totals, params.filter),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .leftJoin(totals, eq(totals.studentId, students.id))
    .where(where);
  const total = counted?.matching ?? 0;
  const page = pageWithin(params.page, total, SKPM_LIST_PAGE_SIZE);
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      activities: totals.activities,
      total: totals.total,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(totals, eq(totals.studentId, students.id))
    .where(where)
    .orderBy(
      sql`${totals.total} desc nulls last`,
      asc(students.name),
      asc(students.nim),
    )
    .limit(SKPM_LIST_PAGE_SIZE)
    .offset((page - 1) * SKPM_LIST_PAGE_SIZE);
  return {
    rows: rows.map(({ activities, total, ...student }) => ({
      ...student,
      totals: totalsOf({ activities, total }, pointsForHundred),
    })),
    matching: total,
    page,
  };
}

async function readActivities(
  db: Database,
  studentId: string,
): Promise<SkpmActivity[]> {
  return db
    .select({
      id: skpmRows.id,
      activity: skpmRows.activity,
      category: skpmRows.category,
      level: skpmRows.level,
      activityRole: skpmRows.activityRole,
      day: skpmRows.day,
      points: skpmRows.points,
    })
    .from(skpmRows)
    .innerJoin(
      skpmUploads,
      and(eq(skpmUploads.id, skpmRows.uploadId), IN_FORCE),
    )
    .where(eq(skpmRows.studentId, studentId))
    .orderBy(desc(skpmUploads.enteredAt), asc(skpmRows.line));
}

/**
 * "Rincian" of one Aktif student the account sees, or null for any other
 * student: the server gives nothing of a student outside what the
 * account may see, whatever the address asks for.
 */
export async function readSkpmDetail(
  db: Database,
  visible: SQL,
  pointsForHundred: number,
  studentId: string,
): Promise<SkpmDetail | null> {
  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(eq(students.id, studentId), seen(visible)));
  if (!student) return null;
  const activities = await readActivities(db, studentId);
  let sum = 0;
  for (const activity of activities) sum += activity.points;
  // Points hold two decimals, which adding in binary can blur.
  const total = Math.round(sum * 100) / 100;
  const counted = { activities: activities.length, total };
  const totals =
    activities.length === 0 ? null : totalsOf(counted, pointsForHundred);
  return { ...student, totals, activities };
}
