import { and, asc, count, eq, isNull, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormCompanions, dormRooms, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import type { CompanionDormId } from "./companion-dorms";
import { UNPLACED_SHOWN } from "./room-limits";
import type { PlacedResident, Resident } from "./room-list";

/**
 * Which kakak pendamping a read is about: the active ones of one dorm,
 * among the students the account that asks may see.
 */
export interface CompanionScope {
  dorm: CompanionDormId;
  /** The student rows the account may see, as a condition. */
  visible: SQL;
}

export interface CompanionCounts {
  active: number;
  /** How many of the active ones have a room. */
  placed: number;
}

/** What the Ploting kamar screen shows of the kakak pendamping of a dorm. */
export interface RoomCompanions {
  /** Those in the rooms of the open floor, in NIM order. */
  placed: PlacedResident[];
  /** The first of those without a room, by name, to choose from. */
  waiting: Resident[];
  counts: CompanionCounts;
}

const COMPANION = { id: students.id, name: students.name, nim: students.nim };

function inScope(scope: CompanionScope): SQL | undefined {
  return and(
    scope.visible,
    eq(dormCompanions.dorm, scope.dorm),
    eq(dormCompanions.isActive, true),
  );
}

async function readPlaced(
  db: Database,
  scope: CompanionScope,
  floor: number,
): Promise<PlacedResident[]> {
  return db
    .select({ ...COMPANION, roomId: dormRooms.id })
    .from(dormCompanions)
    .innerJoin(dormRooms, eq(dormRooms.id, dormCompanions.roomId))
    .innerJoin(students, eq(students.id, dormCompanions.studentId))
    .where(and(inScope(scope), eq(dormRooms.floor, floor)))
    .orderBy(asc(students.nim));
}

async function readWaiting(
  db: Database,
  scope: CompanionScope,
): Promise<Resident[]> {
  return db
    .select(COMPANION)
    .from(dormCompanions)
    .innerJoin(students, eq(students.id, dormCompanions.studentId))
    .where(and(inScope(scope), isNull(dormCompanions.roomId)))
    .orderBy(asc(students.name), asc(students.nim))
    .limit(UNPLACED_SHOWN);
}

async function countCompanions(
  db: Database,
  scope: CompanionScope,
): Promise<CompanionCounts> {
  const [counted] = await db
    .select({ active: count(), placed: count(dormCompanions.roomId) })
    .from(dormCompanions)
    .innerJoin(students, eq(students.id, dormCompanions.studentId))
    .where(inScope(scope));
  return counted ?? { active: 0, placed: 0 };
}

/** A room with its dorm, as a message names where a student is placed. */
export interface RoomInDorm {
  dorm: DormId;
  floor: number;
  number: string;
}

/** The room a student is placed in as kakak pendamping, or null without one. */
export async function readCompanionRoom(
  db: Database,
  studentId: string,
): Promise<RoomInDorm | null> {
  const [room] = await db
    .select({
      dorm: dormRooms.dorm,
      floor: dormRooms.floor,
      number: dormRooms.number,
    })
    .from(dormCompanions)
    .innerJoin(dormRooms, eq(dormRooms.id, dormCompanions.roomId))
    .where(eq(dormCompanions.studentId, studentId))
    .limit(1);
  return room ?? null;
}

/** Reads the kakak pendamping of a dorm for the floor that is open. */
export async function readRoomCompanions(
  db: Database,
  scope: CompanionScope,
  floor: number,
): Promise<RoomCompanions> {
  const [placed, waiting, counts] = await Promise.all([
    readPlaced(db, scope, floor),
    readWaiting(db, scope),
    countCompanions(db, scope),
  ]);
  return { placed, waiting, counts };
}
