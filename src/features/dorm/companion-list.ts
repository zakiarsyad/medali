import { asc, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import type { Database } from "@/db/connect";
import {
  dormCompanions,
  dormRooms,
  students,
  studyPrograms,
} from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";

/** The room a kakak pendamping is placed in. */
export interface CompanionRoom {
  id: string;
  floor: number;
  number: string;
}

/** One row of Daftar kakak pendamping. */
export interface ListedCompanion {
  studentId: string;
  name: string;
  nim: string;
  studyProgram: string;
  /** Null while no academic period runs. */
  semester: number | null;
  dorm: DormId;
  room: CompanionRoom | null;
  note: string | null;
  isActive: boolean;
}

export interface CompanionPage {
  companions: ListedCompanion[];
  /** How many kakak pendamping the account may see, on every page. */
  matching: number;
  /** How many of them are active. */
  active: number;
  /** The page given: the one asked for, or the last when it is past it. */
  page: number;
}

const ROW = {
  studentId: dormCompanions.studentId,
  name: students.name,
  nim: students.nim,
  studyProgram: studyPrograms.name,
  cohortYear: students.cohortYear,
  dorm: dormCompanions.dorm,
  roomId: dormRooms.id,
  roomFloor: dormRooms.floor,
  roomNumber: dormRooms.number,
  note: dormCompanions.note,
  isActive: dormCompanions.isActive,
};

function readRows(db: Database, visible: SQL, page: number) {
  return db
    .select(ROW)
    .from(dormCompanions)
    .innerJoin(students, eq(students.id, dormCompanions.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(dormRooms, eq(dormRooms.id, dormCompanions.roomId))
    .where(visible)
    .orderBy(
      desc(dormCompanions.isActive),
      asc(dormCompanions.dorm),
      asc(students.name),
      asc(students.nim),
    )
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
}

type Row = Awaited<ReturnType<typeof readRows>>[number];

function roomOf(row: Row): CompanionRoom | null {
  if (row.roomId === null || row.roomFloor === null) return null;
  if (row.roomNumber === null) return null;
  return { id: row.roomId, floor: row.roomFloor, number: row.roomNumber };
}

async function countCompanions(db: Database, visible: SQL) {
  const [counted] = await db
    .select({
      matching: count(),
      active: sql`count(*) filter (where ${dormCompanions.isActive})`.mapWith(
        Number,
      ),
    })
    .from(dormCompanions)
    .innerJoin(students, eq(students.id, dormCompanions.studentId))
    .where(visible);
  return counted ?? { matching: 0, active: 0 };
}

/**
 * One page of the kakak pendamping among the students an account may see,
 * the active ones first, with how many there are and how many are active.
 * The semester is that of the day, today when none is given.
 */
export async function listCompanions(
  db: Database,
  visible: SQL,
  page: number,
  day?: string,
): Promise<CompanionPage> {
  const { matching, active } = await countCompanions(db, visible);
  const given = pageWithin(page, matching);
  if (matching === 0) return { companions: [], matching, active, page: given };

  const [rows, period] = await Promise.all([
    readRows(db, visible, given),
    readRunningPeriod(db, day),
  ]);
  const companions = rows.map((row) => ({
    studentId: row.studentId,
    name: row.name,
    nim: row.nim,
    studyProgram: row.studyProgram,
    semester: period ? studentSemester(row.cohortYear, period) : null,
    dorm: row.dorm,
    room: roomOf(row),
    note: row.note,
    isActive: row.isActive,
  }));
  return { companions, matching, active, page: given };
}
