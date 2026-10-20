import {
  and,
  count,
  desc,
  eq,
  gt,
  ilike,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  academicPeriods,
  accounts,
  students,
  violationNotes,
} from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import type { NotesParams } from "./note-address";
import { categoryAt } from "./note-category";
import {
  NOTES_PAGE_SIZE,
  type NoteCategory,
  type NotePunishment,
} from "./violation-note-ids";

/** The four numbers of the running semester. */
export interface NoteNumbers {
  /** Catatan aktif. */
  active: number;
  /** Pelanggaran pertama. */
  first: number;
  /** Pelanggaran lanjutan. */
  further: number;
  /** Mahasiswa berulang: students with two active notes or more. */
  repeated: number;
}

/** One note of the list. */
export interface NoteRow {
  id: string;
  studentId: string;
  name: string;
  nim: string;
  day: string;
  category: NoteCategory;
  /** Whether it is of the running semester, so still in force. */
  isActive: boolean;
  /** How many active notes its student has; null for a note not active. */
  activeNotes: number | null;
  description: string;
  punishment: NotePunishment;
  otherPunishment: string;
  remark: string;
  savedByName: string;
}

export interface NoteList {
  rows: NoteRow[];
  /** How many notes match in all. */
  matching: number;
  /** The page shown, the last one when a later one was asked for. */
  page: number;
}

/** What the tab shows: the running semester, its numbers and the list. */
export interface NoteBoard {
  /** Null while no academic period has begun. */
  period: AcademicPeriod | null;
  numbers: NoteNumbers;
  list: NoteList;
}

const NO_NUMBERS: NoteNumbers = {
  active: 0,
  first: 0,
  further: 0,
  repeated: 0,
};

/**
 * The first day of the semester a note's Tanggal falls in, as "Academic
 * period" gives it: the one that started last by that day.
 */
const PERIOD_START = sql<string>`(select max(${academicPeriods.startsOn}) from ${academicPeriods} where ${academicPeriods.startsOn} <= ${violationNotes.day})`;

const SAME_STUDENT_AND_SEMESTER = sql`partition by ${violationNotes.studentId}, ${PERIOD_START}`;

/**
 * Every note not removed, with the first day of its semester, its place
 * among its student's notes of that semester, the earliest first, and
 * how many those are. A removed note is left out, so the Kategori of the
 * others is worked out from the notes that remain.
 */
function placedNotes(db: Database) {
  return db
    .select({
      id: violationNotes.id,
      studentId: violationNotes.studentId,
      day: violationNotes.day,
      description: violationNotes.description,
      punishment: violationNotes.punishment,
      otherPunishment: violationNotes.otherPunishment,
      remark: violationNotes.remark,
      savedBy: violationNotes.savedBy,
      savedAt: violationNotes.savedAt,
      periodStart: PERIOD_START.as("period_start"),
      place:
        sql<number>`row_number() over (${SAME_STUDENT_AND_SEMESTER} order by ${violationNotes.day}, ${violationNotes.savedAt}, ${violationNotes.id})`.as(
          "place",
        ),
      inSemester: sql<number>`count(*) over (${SAME_STUDENT_AND_SEMESTER})`.as(
        "in_semester",
      ),
    })
    .from(violationNotes)
    .where(isNull(violationNotes.removedAt))
    .as("placed");
}

type Placed = ReturnType<typeof placedNotes>;

/** The notes of the running semester; none while no period has begun. */
function activeIn(placed: Placed, period: AcademicPeriod | null): SQL {
  if (period === null) return sql`false`;
  return sql`${placed.periodStart} = ${period.startsOn}`;
}

function categoryIs(
  placed: Placed,
  category: NotesParams["category"],
): SQL | undefined {
  if (category === "all") return undefined;
  if (category === "first") return eq(placed.place, 1);
  return gt(placed.place, 1);
}

function nameOrNim(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

async function readNumbers(
  db: Database,
  placed: Placed,
  seen: SQL,
  period: AcademicPeriod | null,
): Promise<NoteNumbers> {
  if (period === null) return NO_NUMBERS;
  const [found] = await db
    .select({
      active: count(),
      first: sql<number>`count(*) filter (where ${placed.place} = 1)`.mapWith(
        Number,
      ),
      further: sql<number>`count(*) filter (where ${placed.place} > 1)`.mapWith(
        Number,
      ),
      repeated:
        sql<number>`count(distinct ${placed.studentId}) filter (where ${placed.inSemester} >= 2)`.mapWith(
          Number,
        ),
    })
    .from(placed)
    .innerJoin(students, eq(students.id, placed.studentId))
    .where(and(seen, activeIn(placed, period)));
  return found ?? NO_NUMBERS;
}

async function readList(
  db: Database,
  placed: Placed,
  seen: SQL,
  period: AcademicPeriod | null,
  params: NotesParams,
): Promise<NoteList> {
  const active = activeIn(placed, period);
  const where = and(
    seen,
    params.past ? undefined : active,
    categoryIs(placed, params.category),
    nameOrNim(params.query),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(placed)
    .innerJoin(students, eq(students.id, placed.studentId))
    .where(where);
  const matching = counted?.matching ?? 0;
  const page = pageWithin(params.page, matching, NOTES_PAGE_SIZE);
  const found = await db
    .select({
      id: placed.id,
      studentId: placed.studentId,
      name: students.name,
      nim: students.nim,
      day: placed.day,
      place: sql<number>`${placed.place}`.mapWith(Number),
      inSemester: sql<number>`${placed.inSemester}`.mapWith(Number),
      isActive: sql<boolean>`coalesce(${active}, false)`.mapWith(Boolean),
      description: placed.description,
      punishment: placed.punishment,
      otherPunishment: placed.otherPunishment,
      remark: placed.remark,
      savedByName: accounts.name,
    })
    .from(placed)
    .innerJoin(students, eq(students.id, placed.studentId))
    .innerJoin(accounts, eq(accounts.id, placed.savedBy))
    .where(where)
    .orderBy(desc(placed.day), desc(placed.savedAt), desc(placed.id))
    .limit(NOTES_PAGE_SIZE)
    .offset((page - 1) * NOTES_PAGE_SIZE);
  const rows = found.map(({ place, inSemester, ...row }) => ({
    ...row,
    category: categoryAt(place),
    activeNotes: row.isActive ? inSemester : null,
  }));
  return { rows, matching, page };
}

/**
 * Catatan pelanggaran for an account that may read it: the numbers of
 * the running semester and one page of the notes that match the search
 * and the filters, of the students the account may see by that right,
 * Ketua Program Studi their own program only. The semester of a note is
 * the academic period its Tanggal falls in; only those of the running
 * one are active. Null, with nothing read, for any other account.
 */
export async function readNoteBoard(
  db: Database,
  actor: AccountForAccess,
  params: NotesParams,
  today: string,
): Promise<NoteBoard | null> {
  if (!may(actor.roles, "view_violation_notes")) return null;
  const seen = visibleTo(rowLimitForAction(actor, "view_violation_notes"));
  const period = await readRunningPeriod(db, today);
  const placed = placedNotes(db);
  const [numbers, list] = await Promise.all([
    readNumbers(db, placed, seen, period),
    readList(db, placed, seen, period, params),
  ]);
  return { period, numbers, list };
}
