import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  sikuAdjustmentStudents,
  sikuAdjustments,
  students,
  studyPrograms,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { pageWithin } from "@/ui/list-pages";
import {
  RANKING_SIZE,
  SIKU_LIST_PAGE_SIZE,
  type SikuFilter,
  type SikuParams,
} from "./siku-address";
import type { SikuReason } from "./siku-ids";
import { type SikuTotals, sikuOf } from "./siku-score";
import { IN_FORCE, totalsByStudent } from "./siku-totals";

/** The four numbers at the top of the tab, of the students the account sees. */
export interface SikuNumbers {
  /** How many Aktif students they are. */
  students: number;
  /** Their mean SIKU akhir, or null with no student. */
  mean: number | null;
  gained: number;
  lost: number;
}

/** One student of "Daftar nilai SIKU" or of the ranking. */
export interface SikuRow extends SikuTotals {
  id: string;
  name: string;
  nim: string;
  program: string;
  siku: number;
}

/** The latest entry in force of a student. */
export interface LastEntry {
  day: string;
  reason: SikuReason;
}

export interface SikuListRow extends SikuRow {
  last: LastEntry | null;
}

export interface SikuList {
  rows: SikuListRow[];
  /** How many students the filters let through, on every page. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

export interface SikuRanking {
  falls: SikuRow[];
  rises: SikuRow[];
  /** How many students fell and rose in all. */
  fallCount: number;
  riseCount: number;
}

/** What the students an account sees there and their SIKU are read from. */
function sikuTable(db: Database) {
  const totals = totalsByStudent(db);
  const gains = sql<number>`coalesce(${totals.gains}, 0)`.mapWith(Number);
  const losses = sql<number>`coalesce(${totals.losses}, 0)`.mapWith(Number);
  return { totals, gains, losses, change: sql`${gains} - ${losses}` };
}

type Table = ReturnType<typeof sikuTable>;

/** The Aktif students among those `visible` lets through. */
function seen(visible: SQL): SQL | undefined {
  return and(visible, ACTIVE_MEMBER);
}

function rowOf(base: number, row: Omit<SikuRow, "siku">): SikuRow {
  return { ...row, siku: sikuOf(base, row) };
}

function selectRows(db: Database, table: Table) {
  return db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      gains: table.gains,
      losses: table.losses,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(table.totals, eq(table.totals.studentId, students.id));
}

/**
 * The four numbers: how many students, their mean SIKU akhir, and how
 * many gained and lost points. The students are grouped by their gains
 * and losses in the database, so only a few rows leave it, and SIKU is
 * worked out here by the one rule.
 */
export async function readSikuNumbers(
  db: Database,
  visible: SQL,
  base: number,
): Promise<SikuNumbers> {
  const table = sikuTable(db);
  const groups = await db
    .select({ gains: table.gains, losses: table.losses, students: count() })
    .from(students)
    .leftJoin(table.totals, eq(table.totals.studentId, students.id))
    .where(seen(visible))
    .groupBy(table.gains, table.losses);
  const numbers = { students: 0, gained: 0, lost: 0 };
  let sum = 0;
  for (const group of groups) {
    numbers.students += group.students;
    sum += sikuOf(base, group) * group.students;
    if (group.gains > 0) numbers.gained += group.students;
    if (group.losses > 0) numbers.lost += group.students;
  }
  const mean = numbers.students === 0 ? null : sum / numbers.students;
  return { ...numbers, mean };
}

function filterOf(table: Table, filter: SikuFilter): SQL | undefined {
  switch (filter) {
    case "all":
      return undefined;
    case "gained":
      return gt(table.gains, 0);
    case "lost":
      return gt(table.losses, 0);
    case "base":
      return isNull(table.totals.studentId);
  }
}

function matching(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

/** The latest entry in force of each of some students. */
async function readLastEntries(
  db: Database,
  studentIds: string[],
): Promise<Map<string, LastEntry>> {
  const last = new Map<string, LastEntry>();
  if (studentIds.length === 0) return last;
  const rows = await db
    .selectDistinctOn([sikuAdjustmentStudents.studentId], {
      studentId: sikuAdjustmentStudents.studentId,
      day: sikuAdjustments.day,
      reason: sikuAdjustments.reason,
    })
    .from(sikuAdjustmentStudents)
    .innerJoin(
      sikuAdjustments,
      eq(sikuAdjustments.id, sikuAdjustmentStudents.adjustmentId),
    )
    .where(and(inArray(sikuAdjustmentStudents.studentId, studentIds), IN_FORCE))
    .orderBy(
      sikuAdjustmentStudents.studentId,
      desc(sikuAdjustments.day),
      desc(sikuAdjustments.enteredAt),
    );
  for (const { studentId, ...entry } of rows) last.set(studentId, entry);
  return last;
}

/**
 * One page of "Daftar nilai SIKU": the students the account sees who
 * match the search and the filter, the largest rise first and the
 * largest fall last, then by name.
 */
export async function readSikuList(
  db: Database,
  visible: SQL,
  base: number,
  params: Pick<SikuParams, "query" | "filter" | "page">,
): Promise<SikuList> {
  const table = sikuTable(db);
  const where = and(
    seen(visible),
    matching(params.query),
    filterOf(table, params.filter),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .leftJoin(table.totals, eq(table.totals.studentId, students.id))
    .where(where);
  const total = counted?.matching ?? 0;
  const page = pageWithin(params.page, total, SIKU_LIST_PAGE_SIZE);
  const rows = await selectRows(db, table)
    .where(where)
    .orderBy(desc(table.change), asc(students.name), asc(students.nim))
    .limit(SIKU_LIST_PAGE_SIZE)
    .offset((page - 1) * SIKU_LIST_PAGE_SIZE);
  const last = await readLastEntries(
    db,
    rows.map((row) => row.id),
  );
  return {
    rows: rows.map((row) => ({
      ...rowOf(base, row),
      last: last.get(row.id) ?? null,
    })),
    matching: total,
    page,
  };
}

async function countWhere(db: Database, table: Table, where: SQL | undefined) {
  const [counted] = await db
    .select({ students: count() })
    .from(students)
    .leftJoin(table.totals, eq(table.totals.studentId, students.id))
    .where(where);
  return counted?.students ?? 0;
}

/**
 * "Perubahan nilai SIKU per mahasiswa": the students the account sees
 * whose SIKU fell the most and rose the most from Nilai dasar, 10 of
 * each unless every one is asked for.
 */
export async function readSikuRanking(
  db: Database,
  visible: SQL,
  base: number,
  params: Pick<SikuParams, "allFalls" | "allRises">,
): Promise<SikuRanking> {
  const table = sikuTable(db);
  const fell = and(seen(visible), lt(table.change, 0));
  const rose = and(seen(visible), gt(table.change, 0));
  const falls = selectRows(db, table)
    .where(fell)
    .orderBy(asc(table.change), desc(table.losses), asc(students.name));
  const rises = selectRows(db, table)
    .where(rose)
    .orderBy(desc(table.change), desc(table.gains), asc(students.name));
  const [fallRows, riseRows, fallCount, riseCount] = await Promise.all([
    params.allFalls ? falls : falls.limit(RANKING_SIZE),
    params.allRises ? rises : rises.limit(RANKING_SIZE),
    countWhere(db, table, fell),
    countWhere(db, table, rose),
  ]);
  return {
    falls: fallRows.map((row) => rowOf(base, row)),
    rises: riseRows.map((row) => rowOf(base, row)),
    fallCount,
    riseCount,
  };
}
