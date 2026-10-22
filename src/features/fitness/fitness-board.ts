import {
  and,
  asc,
  count,
  eq,
  ilike,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { students, studyPrograms } from "@/db/schema";
import { finalRankSql } from "@/health-notes/final-category-sql";
import { categoryOf } from "@/health-notes/fitness-category";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import {
  type FinalCategory,
  finalCategory,
  SERIOUSNESS,
} from "@/health-notes/health-category";
import type { NoteCategory, NoteContent } from "@/health-notes/health-ids";
import { readNotesById } from "@/health-notes/health-notes-read";
import { latestFitnessScores } from "@/health-notes/latest-fitness-scores";
import { latestHealthNotes } from "@/health-notes/latest-health-notes";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { pageWithin } from "@/ui/list-pages";
import {
  FITNESS_LIST_PAGE_SIZE,
  type FitnessFilter,
  type FitnessParams,
} from "./fitness-address";
import { countFitness, type FitnessNumbers } from "./fitness-counts";
import { yearStartOf } from "./fitness-input";

/** What a row says of a student's health, for an account that reads their notes. */
export interface RowHealth {
  /** The latest note, or null with none. */
  note: NoteContent | null;
}

/** One student of "Hasil tes kebugaran". */
export interface FitnessListRow {
  id: string;
  name: string;
  nim: string;
  program: string;
  /** The latest score and the day of its test, or null for Belum dites. */
  latest: { score: number; testedOn: string } | null;
  /**
   * The more serious of the test and the latest note. Whether the note
   * made it so is told only with `health`.
   */
  final: FinalCategory;
  /** Null when the account may not read this student's notes. */
  health: RowHealth | null;
}

export interface FitnessList {
  rows: FitnessListRow[];
  /** How many students the filters let through, on every page. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

/** Nobody's notes: what a list reads unless told whose it may. */
const NOBODY = sql`false`;

/** The Aktif students among those `visible` lets through. */
function seen(visible: SQL): SQL | undefined {
  return and(visible, ACTIVE_MEMBER);
}

/**
 * The numbers of the tab and of the panel "Kategori", of the Aktif
 * students the account sees. The students are grouped by their latest
 * score, the day of its test and the category of their latest note, so
 * only a few rows leave the database, and the categories are worked out
 * here by the one rule with the limits in force.
 */
export async function readFitnessNumbers(
  db: Database,
  visible: SQL,
  limits: FitnessLimits,
  today: string,
): Promise<FitnessNumbers> {
  const latest = latestFitnessScores(db);
  const note = latestHealthNotes(db);
  const groups = await db
    .select({
      score: latest.score,
      testedOn: latest.testedOn,
      note: note.category,
      students: count(),
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(note, eq(note.studentId, students.id))
    .where(seen(visible))
    .groupBy(latest.score, latest.testedOn, note.category);
  const yearStart = yearStartOf(today);
  return countFitness(
    groups.map(({ score, testedOn, note, students }) => ({
      students,
      note,
      latest:
        score === null || testedOn === null
          ? null
          : { score, thisYear: testedOn >= yearStart },
    })),
    limits,
  );
}

type Latest = ReturnType<typeof latestFitnessScores>;

/**
 * A category narrows by the final category. Belum dites narrows by the
 * test alone, a student with a note among them, so the list agrees with
 * the line under "Kategori" that counts who has not taken the test.
 */
function filterOf(
  latest: Latest,
  rank: SQL,
  filter: FitnessFilter,
): SQL | undefined {
  if (filter === "all") return undefined;
  if (filter === "untested") return isNull(latest.studentId);
  return sql`${rank} = ${sql.raw(String(SERIOUSNESS[filter]))}`;
}

function matching(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

/** A student as read from the database, before its note is read. */
export interface ReadRow {
  id: string;
  name: string;
  nim: string;
  program: string;
  score: number | null;
  testedOn: string | null;
  noteId: string | null;
  noteCategory: NoteCategory | null;
  readsNote: boolean;
}

/**
 * The notes of the rows whose notes the account reads. A row it may not
 * read asks for nothing, so no note text of it leaves the database.
 */
export async function readableNotes(
  db: Database,
  rows: readonly ReadRow[],
): Promise<Map<string, NoteContent>> {
  const noteIds: string[] = [];
  for (const row of rows) {
    if (row.readsNote && row.noteId !== null) noteIds.push(row.noteId);
  }
  const notes = await readNotesById(db, noteIds);
  const contents = new Map<string, NoteContent>();
  for (const [id, note] of notes) {
    const { illnesses, otherHistory, medicine, advice } = note;
    contents.set(id, { illnesses, otherHistory, medicine, advice });
  }
  return contents;
}

/** A student read, with the note only when the account reads it. */
export function listRow(
  row: ReadRow,
  limits: FitnessLimits,
  notes: Map<string, NoteContent>,
): FitnessListRow {
  const { score, testedOn, noteId, noteCategory, readsNote, ...student } = row;
  const latest =
    score === null || testedOn === null ? null : { score, testedOn };
  const test = latest === null ? null : categoryOf(latest.score, limits);
  const final = finalCategory(test, noteCategory);
  if (!readsNote) {
    return {
      ...student,
      latest,
      final: { ...final, fromNote: false },
      health: null,
    };
  }
  const content = noteId === null ? null : (notes.get(noteId) ?? null);
  return { ...student, latest, final, health: { note: content } };
}

/**
 * One page of "Hasil tes kebugaran": the Aktif students the account sees
 * who match the search and the final-category filter, each with their
 * latest score and final category. The most serious category comes
 * first, then the lowest score, then the name; Belum dites comes last.
 * The latest note is read only of the students `readable` lets through.
 */
export async function readFitnessList(
  db: Database,
  visible: SQL,
  limits: FitnessLimits,
  params: FitnessParams,
  readable: SQL = NOBODY,
): Promise<FitnessList> {
  const latest = latestFitnessScores(db);
  const note = latestHealthNotes(db);
  const rank = finalRankSql(latest.score, note.category, limits);
  const where = and(
    seen(visible),
    matching(params.query),
    filterOf(latest, rank, params.filter),
  );
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(note, eq(note.studentId, students.id))
    .where(where);
  const total = counted?.matching ?? 0;
  const page = pageWithin(params.page, total, FITNESS_LIST_PAGE_SIZE);
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      score: latest.score,
      testedOn: latest.testedOn,
      noteId: note.noteId,
      noteCategory: note.category,
      readsNote: sql<boolean>`coalesce(${readable}, false)`,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(note, eq(note.studentId, students.id))
    .where(where)
    .orderBy(
      sql`${rank} desc nulls last`,
      sql`${latest.score} asc nulls last`,
      asc(students.name),
      asc(students.nim),
    )
    .limit(FITNESS_LIST_PAGE_SIZE)
    .offset((page - 1) * FITNESS_LIST_PAGE_SIZE);
  const notes = await readableNotes(db, rows);
  return {
    rows: rows.map((row) => listRow(row, limits, notes)),
    matching: total,
    page,
  };
}
