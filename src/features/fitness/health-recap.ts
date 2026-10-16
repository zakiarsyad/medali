import { and, asc, count, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  accounts,
  dormRoomPlaces,
  dormRooms,
  healthNoteIllnesses,
  healthRecapReadings,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { pageWithin } from "@/ui/list-pages";
import { finalRankSql } from "./final-category-sql";
import { categoryOf } from "./fitness-category";
import type { FitnessLimits } from "./fitness-ids";
import {
  type FinalCategory,
  finalCategory,
  SERIOUSNESS,
} from "./health-category";
import type { HealthNote, NoteCategory } from "./health-ids";
import { readNotesById } from "./health-notes-read";
import { dormCohortsOn } from "./health-subject";
import { latestFitnessScores } from "./latest-fitness-scores";
import { latestHealthNotes } from "./latest-health-notes";
import { RECAP_PAGE_SIZE, type RecapParams } from "./recap-address";

/** The four numbers of the recap, and what their hints need. */
export interface RecapNumbers {
  /** "Mahasiswa aktif". */
  students: number;
  /** Of them, those who live in a dorm. */
  dorm: number;
  /** "Sakit atau punya riwayat penyakit": the students the recap lists. */
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

export interface HealthRecap {
  numbers: RecapNumbers;
  rows: RecapRow[];
  /** How many students the filters let through, on every page. */
  matching: number;
  /** The page shown, the last one when the address asked for more. */
  page: number;
}

const MEDICAL = sql.raw(String(SERIOUSNESS.medical));
const ATTENTION = sql.raw(String(SERIOUSNESS.attention));

/** The parts of the recap's reads that work on one student row. */
function recapParts(db: Database, limits: FitnessLimits, dorms: number[]) {
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

type Parts = ReturnType<typeof recapParts>;

function counted(condition: SQL): SQL<number> {
  return sql<number>`(count(*) filter (where ${condition}))::int`;
}

async function readNumbers(
  db: Database,
  parts: Parts,
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
  if (!numbers) throw new Error("The numbers of the recap were not read.");
  return numbers;
}

function filtersOf(parts: Parts, params: RecapParams): SQL | undefined {
  const { note, rank, dorm } = parts;
  const conditions: (SQL | undefined)[] = [];
  if (params.query !== "") {
    const pattern = containsPattern(params.query);
    conditions.push(
      or(ilike(students.name, pattern), ilike(students.nim, pattern)),
    );
  }
  if (params.residence === "dorm") conditions.push(sql`${dorm} is not null`);
  if (params.residence === "non_dorm") conditions.push(sql`${dorm} is null`);
  if (params.category !== "all") {
    const wanted = sql.raw(String(SERIOUSNESS[params.category]));
    conditions.push(sql`${rank} = ${wanted}`);
  }
  if (params.illness !== "all") {
    conditions.push(sql`exists (
      select 1 from ${healthNoteIllnesses}
      where ${healthNoteIllnesses.noteId} = ${note.noteId}
        and ${healthNoteIllnesses.illness} = ${params.illness}
    )`);
  }
  return and(...conditions);
}

/** The mentor of today of the group in force a student is in. */
const MENTOR_NAME = sql<string | null>`(
  select ${accounts.name} from ${mentorGroupMembers}
  inner join ${mentorGroups}
    on ${mentorGroups.id} = ${mentorGroupMembers.groupId}
    and ${mentorGroups.endedAt} is null
  inner join ${mentorGroupMentors}
    on ${mentorGroupMentors.groupId} = ${mentorGroups.id}
    and ${mentorGroupMentors.endsOn} is null
  inner join ${accounts} on ${accounts.id} = ${mentorGroupMentors.mentorId}
  where ${mentorGroupMembers.studentId} = ${students.id}
  limit 1
)`;

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

function recapRow(
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
  parts: Parts,
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
      and(
        eq(dormRooms.id, dormRoomPlaces.roomId),
        sql`${dormRooms.dorm} = ${dorm}`,
      ),
    )
    .where(where)
    .orderBy(
      sql`${rank} desc nulls last`,
      asc(students.name),
      asc(students.nim),
    )
    .limit(RECAP_PAGE_SIZE)
    .offset((page - 1) * RECAP_PAGE_SIZE);
}

async function logReading(
  db: Database,
  actor: AccountForAccess,
  params: RecapParams,
  page: number,
): Promise<void> {
  await db.insert(healthRecapReadings).values({
    readBy: actor.id,
    readAt: WRITTEN_NOW,
    filters: {
      searched: params.query !== "",
      residence: params.residence,
      category: params.category,
      illness: params.illness,
      page,
    },
  });
}

/**
 * "Rekap data kesehatan seluruh mahasiswa", for an account with its
 * right, Kepala Unit alone: the four numbers of the Aktif students it
 * sees, dorm or not, and one page of those with an illness history, a
 * note with a category of its own, or Perlu tindak lanjut medis, that
 * match the search and filters; the most serious category first, then
 * by name. Each reading is logged, without a name, an illness or a
 * note's text. Null, with nothing read or logged, for any other account.
 */
export async function readHealthRecap(
  db: Database,
  actor: AccountForAccess,
  params: RecapParams,
  limits: FitnessLimits,
  today: string,
): Promise<HealthRecap | null> {
  if (!may(actor.roles, "view_health_recap")) return null;
  const visible = visibleTo(rowLimitForAction(actor, "view_health_recap"));
  const parts = recapParts(db, limits, await dormCohortsOn(db, today));
  const seen = and(visible, ACTIVE_MEMBER);
  const where = and(seen, parts.listed, filtersOf(parts, params));
  const [numbers, [found]] = await Promise.all([
    readNumbers(db, parts, seen),
    db
      .select({ matching: count() })
      .from(students)
      .leftJoin(parts.latest, eq(parts.latest.studentId, students.id))
      .leftJoin(parts.note, eq(parts.note.studentId, students.id))
      .where(where),
  ]);
  const matching = found?.matching ?? 0;
  const page = pageWithin(params.page, matching, RECAP_PAGE_SIZE);
  const rows = await readPage(db, parts, where, page);
  const noteIds = rows.flatMap((row) => (row.noteId ? [row.noteId] : []));
  const notes = await readNotesById(db, noteIds);
  await logReading(db, actor, params, page);
  return {
    numbers,
    rows: rows.map((row) => recapRow(row, limits, notes)),
    matching,
    page,
  };
}
