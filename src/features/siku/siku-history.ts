import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  isNull,
  max,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  sikuAdjustmentStudents,
  sikuAdjustments,
  sikuRequests,
  sikuUploads,
  students,
  studyPrograms,
} from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import { HISTORY_PAGE_SIZE, SEEN_PAGE_SIZE } from "./siku-address";
import type { SikuKind, SikuReason } from "./siku-ids";
import { IN_FORCE } from "./siku-totals";

/** An entry of "Riwayat penambahan dan pengurangan SIKU" made with the form. */
export interface FormEntry {
  source: "form";
  id: string;
  day: string;
  kind: SikuKind;
  reason: SikuReason;
  points: number;
  /** How many of its students the account sees. */
  students: number;
  note: string;
  basis: string;
  /** Whether an approved request of a student made it. */
  fromRequest: boolean;
  /** The name of the staff member who entered it. */
  enteredBy: string;
}

/** An uploaded file of the history: its rows in force, as one entry. */
export interface UploadEntry {
  source: "upload";
  id: string;
  /** The day it was saved, which every row of it has. */
  day: string;
  fileName: string;
  /** How many different students of its rows the account sees. */
  students: number;
  enteredBy: string;
}

export type HistoryEntry = FormEntry | UploadEntry;

export interface SikuHistory {
  entries: HistoryEntry[];
  /** How many entries there are, on every page. */
  matching: number;
  page: number;
}

/** The gain or loss of one row of an upload, for its one student. */
export interface SeenChange {
  kind: SikuKind;
  reason: SikuReason;
  points: number;
}

/**
 * A line of "Lihat mahasiswa": a student of a form entry, or one row of
 * an upload with the student's own change. `id` tells the lines apart.
 */
export interface SeenStudent {
  id: string;
  name: string;
  nim: string;
  program: string;
  change: SeenChange | null;
}

export interface SeenStudents {
  entry: HistoryEntry;
  students: SeenStudent[];
  matching: number;
  page: number;
}

/** A row entered with the form, not from a file. */
const FROM_FORM = isNull(sikuAdjustments.uploadId);

/** Whether the entry in the outer query was made by approving a request. */
export const FROM_REQUEST = sql<boolean>`exists (
  select 1 from ${sikuRequests}
  where ${sikuRequests.entryId} = ${sikuAdjustments.id}
)`;

/** The entry a row is shown in: its upload, or the row itself. */
const ENTRY_OF_ROW = sql<string>`coalesce(${sikuAdjustments.uploadId}, ${sikuAdjustments.id})`;

/**
 * The students of the row in the outer query that the account sees, how
 * many: `visible` reads the student rows.
 */
function visibleCount(visible: SQL): SQL<number> {
  return sql<number>`(
    select count(*) from ${sikuAdjustmentStudents}
    inner join ${students} on ${students.id} = ${sikuAdjustmentStudents.studentId}
    where ${sikuAdjustmentStudents.adjustmentId} = ${sikuAdjustments.id}
      and ${visible}
  )`.mapWith(Number);
}

/** A row in force that names at least one student the account sees. */
function seenRows(visible: SQL): SQL | undefined {
  return and(IN_FORCE, sql`${visibleCount(visible)} > 0`);
}

async function readFormEntries(
  db: Database,
  visible: SQL,
  where: SQL | undefined,
): Promise<FormEntry[]> {
  const rows = await db
    .select({
      id: sikuAdjustments.id,
      day: sikuAdjustments.day,
      kind: sikuAdjustments.kind,
      reason: sikuAdjustments.reason,
      points: sikuAdjustments.points,
      students: visibleCount(visible),
      note: sikuAdjustments.note,
      basis: sikuAdjustments.basis,
      fromRequest: FROM_REQUEST,
      enteredBy: accounts.name,
    })
    .from(sikuAdjustments)
    .innerJoin(accounts, eq(accounts.id, sikuAdjustments.enteredBy))
    .where(and(FROM_FORM, seenRows(visible), where));
  return rows.map((row) => ({ source: "form", ...row }));
}

/** Uploads with a row in force for a student the account sees. */
async function readUploadEntries(
  db: Database,
  visible: SQL,
  ids: string[],
): Promise<UploadEntry[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({
      id: sikuUploads.id,
      day: sql<string>`max(${sikuAdjustments.day})`,
      fileName: sikuUploads.fileName,
      students: countDistinct(sikuAdjustmentStudents.studentId),
      enteredBy: accounts.name,
    })
    .from(sikuUploads)
    .innerJoin(accounts, eq(accounts.id, sikuUploads.enteredBy))
    .innerJoin(
      sikuAdjustments,
      and(eq(sikuAdjustments.uploadId, sikuUploads.id), IN_FORCE),
    )
    .innerJoin(
      sikuAdjustmentStudents,
      eq(sikuAdjustmentStudents.adjustmentId, sikuAdjustments.id),
    )
    .innerJoin(students, eq(students.id, sikuAdjustmentStudents.studentId))
    .where(and(inArray(sikuUploads.id, ids), visible))
    .groupBy(sikuUploads.id, accounts.name);
  return rows.map((row) => ({ source: "upload", ...row }));
}

/** The entries of some keys, in the order of the keys. */
async function readEntries(
  db: Database,
  visible: SQL,
  ids: string[],
): Promise<HistoryEntry[]> {
  if (ids.length === 0) return [];
  const [forms, uploads] = await Promise.all([
    readFormEntries(db, visible, inArray(sikuAdjustments.id, ids)),
    readUploadEntries(db, visible, ids),
  ]);
  const byId = new Map<string, HistoryEntry>();
  for (const entry of [...forms, ...uploads]) byId.set(entry.id, entry);
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/**
 * One page of the history: the entries in force that name a student the
 * account sees, the latest day first, 20 a page. An upload is one entry,
 * however many rows it holds. A cancelled entry is kept, and left out
 * here.
 */
export async function readSikuHistory(
  db: Database,
  visible: SQL,
  page: number,
): Promise<SikuHistory> {
  const where = seenRows(visible);
  const [counted] = await db
    .select({ matching: countDistinct(ENTRY_OF_ROW) })
    .from(sikuAdjustments)
    .where(where);
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, HISTORY_PAGE_SIZE);
  const keys = await db
    .select({ id: ENTRY_OF_ROW })
    .from(sikuAdjustments)
    .where(where)
    .groupBy(ENTRY_OF_ROW)
    .orderBy(
      desc(max(sikuAdjustments.day)),
      desc(max(sikuAdjustments.enteredAt)),
    )
    .limit(HISTORY_PAGE_SIZE)
    .offset((shown - 1) * HISTORY_PAGE_SIZE);
  const ids = keys.map((key) => key.id);
  return {
    entries: await readEntries(db, visible, ids),
    matching,
    page: shown,
  };
}

function selectLines(db: Database) {
  return db
    .select({
      id: sikuAdjustments.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      kind: sikuAdjustments.kind,
      reason: sikuAdjustments.reason,
      points: sikuAdjustments.points,
    })
    .from(sikuAdjustments)
    .innerJoin(
      sikuAdjustmentStudents,
      eq(sikuAdjustmentStudents.adjustmentId, sikuAdjustments.id),
    )
    .innerJoin(students, eq(students.id, sikuAdjustmentStudents.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId));
}

/** One page of the rows of an upload, each with its student's own change. */
async function readUploadLines(
  db: Database,
  visible: SQL,
  entry: UploadEntry,
  page: number,
): Promise<SeenStudents> {
  const where = and(eq(sikuAdjustments.uploadId, entry.id), IN_FORCE, visible);
  const [counted] = await db
    .select({ matching: count() })
    .from(sikuAdjustments)
    .innerJoin(
      sikuAdjustmentStudents,
      eq(sikuAdjustmentStudents.adjustmentId, sikuAdjustments.id),
    )
    .innerJoin(students, eq(students.id, sikuAdjustmentStudents.studentId))
    .where(where);
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, SEEN_PAGE_SIZE);
  const rows = await selectLines(db)
    .where(where)
    .orderBy(asc(students.name), asc(students.nim), asc(sikuAdjustments.id))
    .limit(SEEN_PAGE_SIZE)
    .offset((shown - 1) * SEEN_PAGE_SIZE);
  const lines = rows.map(({ kind, reason, points, ...student }) => ({
    ...student,
    change: { kind, reason, points },
  }));
  return { entry, students: lines, matching, page: shown };
}

/** One page of the students of a form entry. */
async function readFormStudents(
  db: Database,
  visible: SQL,
  entry: FormEntry,
  page: number,
): Promise<SeenStudents> {
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
  const lines = rows.map((row) => ({ ...row, change: null }));
  return { entry, students: lines, matching: entry.students, page: shown };
}

/**
 * "Lihat mahasiswa": one page of what an entry in force holds for the
 * students the account sees, by name, 25 a page: the students of a form
 * entry, or each row of an upload. Null for an entry that is not there,
 * is cancelled, or names nobody the account sees.
 */
export async function readSeenStudents(
  db: Database,
  visible: SQL,
  entryId: string,
  page: number,
): Promise<SeenStudents | null> {
  const [entry] = await readEntries(db, visible, [entryId]);
  if (!entry) return null;
  if (entry.source === "upload") {
    return readUploadLines(db, visible, entry, page);
  }
  return readFormStudents(db, visible, entry, page);
}
