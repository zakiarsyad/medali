import { and, asc, count, desc, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  sikuAdjustmentStudents,
  sikuAdjustments,
  students,
  studyPrograms,
} from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import { HISTORY_PAGE_SIZE, SEEN_PAGE_SIZE } from "./siku-address";
import type { SikuKind, SikuReason } from "./siku-ids";
import { IN_FORCE } from "./siku-totals";

/** One entry of "Riwayat penambahan dan pengurangan SIKU". */
export interface HistoryEntry {
  id: string;
  day: string;
  kind: SikuKind;
  reason: SikuReason;
  points: number;
  /** How many of its students the account sees. */
  students: number;
  note: string;
  basis: string;
  /** The name of the staff member who entered it. */
  enteredBy: string;
}

export interface SikuHistory {
  entries: HistoryEntry[];
  /** How many entries there are, on every page. */
  matching: number;
  page: number;
}

/** A student of an entry, as "Lihat mahasiswa" shows them. */
export interface SeenStudent {
  id: string;
  name: string;
  nim: string;
  program: string;
}

export interface SeenStudents {
  entry: HistoryEntry;
  students: SeenStudent[];
  matching: number;
  page: number;
}

/**
 * The students of the entry in the outer query that the account sees,
 * how many: `visible` reads the student rows.
 */
function visibleCount(visible: SQL): SQL<number> {
  return sql<number>`(
    select count(*) from ${sikuAdjustmentStudents}
    inner join ${students} on ${students.id} = ${sikuAdjustmentStudents.studentId}
    where ${sikuAdjustmentStudents.adjustmentId} = ${sikuAdjustments.id}
      and ${visible}
  )`.mapWith(Number);
}

function selectEntries(db: Database, visible: SQL) {
  return db
    .select({
      id: sikuAdjustments.id,
      day: sikuAdjustments.day,
      kind: sikuAdjustments.kind,
      reason: sikuAdjustments.reason,
      points: sikuAdjustments.points,
      students: visibleCount(visible),
      note: sikuAdjustments.note,
      basis: sikuAdjustments.basis,
      enteredBy: accounts.name,
    })
    .from(sikuAdjustments)
    .innerJoin(accounts, eq(accounts.id, sikuAdjustments.enteredBy));
}

/** An entry in force that names at least one student the account sees. */
function seenEntries(visible: SQL): SQL | undefined {
  return and(IN_FORCE, sql`${visibleCount(visible)} > 0`);
}

/**
 * One page of the history: the entries in force that name a student the
 * account sees, the latest day first, 20 a page. A cancelled entry is
 * kept, and left out here.
 */
export async function readSikuHistory(
  db: Database,
  visible: SQL,
  page: number,
): Promise<SikuHistory> {
  const where = seenEntries(visible);
  const [counted] = await db
    .select({ matching: count() })
    .from(sikuAdjustments)
    .where(where);
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, HISTORY_PAGE_SIZE);
  const entries = await selectEntries(db, visible)
    .where(where)
    .orderBy(desc(sikuAdjustments.day), desc(sikuAdjustments.enteredAt))
    .limit(HISTORY_PAGE_SIZE)
    .offset((shown - 1) * HISTORY_PAGE_SIZE);
  return { entries, matching, page: shown };
}

/**
 * "Lihat mahasiswa": one page of the students of an entry in force that
 * the account sees, by name, 25 a page. Null for an entry that is not
 * there, is cancelled, or names nobody the account sees.
 */
export async function readSeenStudents(
  db: Database,
  visible: SQL,
  entryId: string,
  page: number,
): Promise<SeenStudents | null> {
  const [entry] = await selectEntries(db, visible).where(
    and(eq(sikuAdjustments.id, entryId), seenEntries(visible)),
  );
  if (!entry) return null;
  const shown = pageWithin(page, entry.students, SEEN_PAGE_SIZE);
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
    })
    .from(sikuAdjustmentStudents)
    .innerJoin(students, eq(students.id, sikuAdjustmentStudents.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(eq(sikuAdjustmentStudents.adjustmentId, entry.id), visible))
    .orderBy(asc(students.name), asc(students.nim))
    .limit(SEEN_PAGE_SIZE)
    .offset((shown - 1) * SEEN_PAGE_SIZE);
  return { entry, students: rows, matching: entry.students, page: shown };
}
