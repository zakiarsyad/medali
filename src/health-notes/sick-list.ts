import { and, asc, count, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  dormRoomPlaces,
  dormRooms,
  healthNoteIllnesses,
  students,
  studyPrograms,
} from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { dormInSql, isPlaceRoomOf } from "@/dorms/resident-condition";
import { MENTOR_NAME } from "@/mentoring/mentor-name";
import { pageWithin } from "@/ui/list-pages";
import { finalRankSql } from "./final-category-sql";
import { categoryOf } from "./fitness-category";
import type { FitnessCategory, FitnessLimits } from "./fitness-ids";
import {
  type FinalCategory,
  finalCategory,
  SERIOUSNESS,
} from "./health-category";
import type { HealthNote, Illness, NoteCategory } from "./health-ids";
import { readNotesById } from "./health-notes-read";
import { latestFitnessScores } from "./latest-fitness-scores";
import { latestHealthNotes } from "./latest-health-notes";

/** How many students one page of a list of sick students shows. */
export const SICK_PAGE_SIZE = 25;

/** The four numbers above a list of sick students, and what their hints need. */
export interface RecapNumbers {
  /** The students the list is drawn from. */
  students: number;
  /** Of them, those who live in a dorm. */
  dorm: number;
  /** "Sakit atau punya riwayat penyakit": the students the list holds. */
  listed: number;
  /** Of the listed, those in Perlu perhatian. */
  attention: number;
  /** Of the listed, those in Perlu tindak lanjut medis. */
  medical: number;
  /** Of those, the ones with no note. */
  medicalWithoutNote: number;
}

/** A dorm resident's room, or null for one not placed yet. */
export interface RecapRoom {
  dorm: DormId;
  floor: number;
  number: string;
}

export interface RecapRow {
  id: string;
  name: string;
  nim: string;
  program: string;
  /** Null for a student who lives in no dorm. */
  dorm: DormId | null;
  room: RecapRoom | null;
  /** The mentor of the student's group in force, or null. */
  mentorName: string | null;
  final: FinalCategory;
  /** The latest note, or null with none. */
  note: HealthNote | null;
}

/** One page of a list of sick students, with its numbers. */
export interface SickList {
  numbers: RecapNumbers;
  rows: RecapRow[];
  /** How many students the filters let through, on every page. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

/** The search and the filters every list of sick students has. */
export interface SickFilters {
  query: string;
  category: FitnessCategory | "all";
  illness: Illness | "all";
  page: number;
}

const MEDICAL = sql.raw(String(SERIOUSNESS.medical));
const ATTENTION = sql.raw(String(SERIOUSNESS.attention));

/** The parts of the list's reads that work on one student row. */
export function sickParts(
  db: Database,
  limits: FitnessLimits,
  dorms: number[],
) {
  const latest = latestFitnessScores(db);
  const note = latestHealthNotes(db);
  const rank = finalRankSql(latest.score, note.category, limits);
  const hasIllness = sql`exists (
    select 1 from ${healthNoteIllnesses}
    where ${healthNoteIllnesses.noteId} = ${note.noteId}
  )`;
  const hasHistory = sql`(${hasIllness} or coalesce(${note.otherHistory}, '') <> '')`;
  // Listed: an illness history, a note with its own category, or Perlu
  // tindak lanjut medis.
  const listed = sql`(${hasHistory} or ${note.category} is not null or coalesce(${rank} = ${MEDICAL}, false))`;
  const dorm = dormInSql(dorms);
  return { latest, note, rank, listed, dorm };
}

export type SickParts = ReturnType<typeof sickParts>;

function counted(condition: SQL): SQL<number> {
  return sql<number>`(count(*) filter (where ${condition}))::int`;
}

/** The four numbers of the students `seen` lets through. */
export async function readSickNumbers(
  db: Database,
  parts: SickParts,
  seen: SQL | undefined,
): Promise<RecapNumbers> {
  const { latest, note, rank, listed, dorm } = parts;
  const [numbers] = await db
    .select({
      students: count(),
      dorm: counted(sql`${dorm} is not null`),
      listed: counted(listed),
      attention: counted(sql`${listed} and ${rank} = ${ATTENTION}`),
      medical: counted(sql`${listed} and ${rank} = ${MEDICAL}`),
      medicalWithoutNote: counted(
        sql`${listed} and ${rank} = ${MEDICAL} and ${note.noteId} is null`,
      ),
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(note, eq(note.studentId, students.id))
    .where(seen);
  if (!numbers) throw new Error("The numbers of the sick list were not read.");
  return numbers;
}

/** The condition of the search and the filters every list has. */
function filtersOf(parts: SickParts, filters: SickFilters): SQL | undefined {
  const { note, rank } = parts;
  const conditions: (SQL | undefined)[] = [];
  if (filters.query !== "") {
    const pattern = containsPattern(filters.query);
    conditions.push(
      or(ilike(students.name, pattern), ilike(students.nim, pattern)),
    );
  }
  if (filters.category !== "all") {
    const wanted = sql.raw(String(SERIOUSNESS[filters.category]));
    conditions.push(sql`${rank} = ${wanted}`);
  }
  if (filters.illness !== "all") {
    conditions.push(sql`exists (
      select 1 from ${healthNoteIllnesses}
      where ${healthNoteIllnesses.noteId} = ${note.noteId}
        and ${healthNoteIllnesses.illness} = ${filters.illness}
    )`);
  }
  return and(...conditions);
}

interface ReadRow {
  id: string;
  name: string;
  nim: string;
  program: string;
  dorm: DormId | null;
  floor: number | null;
  roomNumber: string | null;
  mentorName: string | null;
  score: number | null;
  noteId: string | null;
  noteCategory: NoteCategory | null;
}

function sickRow(
  row: ReadRow,
  limits: FitnessLimits,
  notes: Map<string, HealthNote>,
): RecapRow {
  const { floor, roomNumber, score, noteId, noteCategory, ...student } = row;
  const test = score === null ? null : categoryOf(score, limits);
  const room =
    student.dorm === null || floor === null || roomNumber === null
      ? null
      : { dorm: student.dorm, floor, number: roomNumber };
  const note = noteId === null ? null : (notes.get(noteId) ?? null);
  return {
    ...student,
    room,
    final: finalCategory(test, noteCategory),
    note,
  };
}

async function readPage(
  db: Database,
  parts: SickParts,
  where: SQL | undefined,
  page: number,
): Promise<ReadRow[]> {
  const { latest, note, rank, dorm } = parts;
  return db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      dorm,
      floor: dormRooms.floor,
      roomNumber: dormRooms.number,
      mentorName: MENTOR_NAME,
      score: latest.score,
      noteId: note.noteId,
      noteCategory: note.category,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(note, eq(note.studentId, students.id))
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(
      dormRooms,
      and(eq(dormRooms.id, dormRoomPlaces.roomId), isPlaceRoomOf(dorm)),
    )
    .where(where)
    .orderBy(
      sql`${rank} desc nulls last`,
      asc(students.name),
      asc(students.nim),
    )
    .limit(SICK_PAGE_SIZE)
    .offset((page - 1) * SICK_PAGE_SIZE);
}

/**
 * The four numbers of the students `seen` lets through, and one page of
 * those with an illness history, a note with a category of its own, or
 * Perlu tindak lanjut medis, that match the search, the filters and what
 * `narrowed` adds; the most serious category first, then by name. The
 * caller decides who may read the list and whose rows it holds.
 */
export async function readSickList(
  db: Database,
  parts: SickParts,
  seen: SQL | undefined,
  narrowed: SQL | undefined,
  filters: SickFilters,
  limits: FitnessLimits,
): Promise<SickList> {
  const where = and(seen, parts.listed, narrowed, filtersOf(parts, filters));
  const [numbers, [found]] = await Promise.all([
    readSickNumbers(db, parts, seen),
    db
      .select({ matching: count() })
      .from(students)
      .leftJoin(parts.latest, eq(parts.latest.studentId, students.id))
      .leftJoin(parts.note, eq(parts.note.studentId, students.id))
      .where(where),
  ]);
  const matching = found?.matching ?? 0;
  const page = pageWithin(filters.page, matching, SICK_PAGE_SIZE);
  const rows = await readPage(db, parts, where, page);
  const noteIds = rows.flatMap((row) => (row.noteId ? [row.noteId] : []));
  const notes = await readNotesById(db, noteIds);
  return {
    numbers,
    rows: rows.map((row) => sickRow(row, limits, notes)),
    matching,
    page,
  };
}
