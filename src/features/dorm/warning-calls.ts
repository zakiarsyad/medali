import {
  and,
  asc,
  eq,
  inArray,
  isNotNull,
  isNull,
  type SQL,
  sql,
} from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "@/db/connect";
import {
  dormRoomPlaces,
  dormRooms,
  dormWarningLetters,
  students,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import { pageWithin } from "@/ui/list-pages";
import { roomWords } from "./leave-list";
import {
  type CallSchedule,
  WARNINGS_PAGE_SIZE,
  type WarningLevel,
} from "./warning-ids";
import { causesOf, letterMark } from "./warning-rule";
import {
  readWarningSemester,
  standingOf,
  standingsOf,
  type WarningSemester,
} from "./warning-standing";

/** One resident of "Panggilan klarifikasi dan surat peringatan". */
export interface WarningCall {
  studentId: string;
  name: string;
  nim: string;
  /** Where they live today, as the lists of the dorm say it. */
  room: string;
  /** Violations of the semester gone up to Pengelola Asrama. */
  counted: number;
  /** The SP they are called for. */
  level: WarningLevel;
  causes: string[];
  /** The highest SP already issued in the semester, or none. */
  mark: WarningLevel | null;
  /** The call for `level`, or null while it is not scheduled. */
  schedule: CallSchedule | null;
}

export interface WarningCalls {
  /** The running semester, or null while no period is stored. */
  semester: Pick<WarningSemester, "id" | "title"> | null;
  calls: WarningCall[];
  /** How many residents are called: "Panggilan klarifikasi aktif". */
  active: number;
  /** How many residents have an SP of the semester. */
  withLetter: number;
  page: number;
}

const NONE: WarningCalls = {
  semester: null,
  calls: [],
  active: 0,
  withLetter: 0,
  page: 1,
};

type Standings = ReturnType<typeof standingsOf>;

async function readNumbers(db: Database, standing: Standings, visible: SQL) {
  const [counted] = await db
    .select({
      active: sql<number>`(count(*) filter (where ${isNotNull(standing.level)}))::int`,
      withLetter: sql<number>`(count(*) filter (where ${standing.hasFirst}))::int`,
    })
    .from(standing)
    .innerJoin(students, eq(students.id, standing.studentId))
    .where(visible);
  return { active: counted?.active ?? 0, withLetter: counted?.withLetter ?? 0 };
}

function readPage(
  db: Database,
  standing: Standings,
  visible: SQL,
  dorm: SQL<DormId | null>,
  page: number,
) {
  return db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      dorm,
      room: dormRooms.number,
      counted: standing.counted,
      rejected: standing.rejected,
      hasFirst: standing.hasFirst,
      hasSecond: standing.hasSecond,
      level: standing.level,
    })
    .from(standing)
    .innerJoin(students, eq(students.id, standing.studentId))
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(
      dormRooms,
      and(
        eq(dormRooms.id, dormRoomPlaces.roomId),
        sql`${dormRooms.dorm} = ${dorm}`,
      ),
    )
    .where(and(visible, isNotNull(standing.level)))
    .orderBy(asc(students.name), asc(students.nim))
    .limit(WARNINGS_PAGE_SIZE)
    .offset((page - 1) * WARNINGS_PAGE_SIZE);
}

/** The calls not issued yet of some students in a semester, by student and level. */
export async function readSchedules(
  db: Database,
  semesterId: string,
  studentIds: string[],
): Promise<Map<string, CallSchedule>> {
  const schedules = new Map<string, CallSchedule>();
  if (studentIds.length === 0) return schedules;
  const rows = await db
    .select()
    .from(dormWarningLetters)
    .where(
      and(
        eq(dormWarningLetters.periodId, semesterId),
        inArray(dormWarningLetters.studentId, studentIds),
        isNull(dormWarningLetters.issuedAt),
        isNotNull(dormWarningLetters.callDay),
      ),
    );
  for (const row of rows) {
    if (row.callDay === null || row.callTime === null) continue;
    schedules.set(`${row.studentId}:${row.level}`, {
      day: row.callDay,
      time: hourAndMinute(row.callTime),
      place: row.callPlace ?? "",
    });
  }
  return schedules;
}

/**
 * "Panggilan klarifikasi dan surat peringatan" of the running semester,
 * at `now` by the server's clock, among the students `visible` holds:
 * each resident called for an SP, by name, 20 a page, with why and the
 * schedule of the call; how many are called; and how many have an SP of
 * the semester. A fixed number of reads, however many residents there
 * are.
 */
export async function readWarningCalls(
  db: Database,
  visible: SQL,
  now: Date,
  page: number,
): Promise<WarningCalls> {
  const semester = await readWarningSemester(db, now);
  if (semester === null) return NONE;
  return readCallsIn(db, semester, visible, now, page);
}

/** The calls of `readWarningCalls`, of a semester already read. */
export async function readCallsIn(
  db: Database,
  semester: WarningSemester,
  visible: SQL,
  now: Date,
  page: number,
): Promise<WarningCalls> {
  const standing = standingsOf(db, semester, now);
  const [numbers, dormCohorts] = await Promise.all([
    readNumbers(db, standing, visible),
    readDormCohorts(db, campusDay(now)),
  ]);
  const shown = pageWithin(page, numbers.active, WARNINGS_PAGE_SIZE);
  const dorm = dormInSql(dormCohorts ?? []);
  const rows = await readPage(db, standing, visible, dorm, shown);
  const schedules = await readSchedules(
    db,
    semester.id,
    rows.map((row) => row.studentId),
  );
  const calls: WarningCall[] = [];
  for (const row of rows) {
    if (row.level === null) continue;
    const kept = standingOf(row);
    calls.push({
      studentId: row.studentId,
      name: row.name,
      nim: row.nim,
      room: roomWords(row.dorm, row.room),
      counted: row.counted,
      level: row.level,
      causes: causesOf(kept, row.level),
      mark: letterMark(kept),
      schedule: schedules.get(`${row.studentId}:${row.level}`) ?? null,
    });
  }
  return {
    semester: { id: semester.id, title: semester.title },
    calls,
    ...numbers,
    page: shown,
  };
}
