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
import { dormRoomPlaces, dormRooms, students } from "@/db/schema";
import type { DormId } from "./dorms";
import { livesIn } from "./resident-condition";
import { UNPLACED_SHOWN } from "./room-limits";

/** One room with the number of its places that are taken. */
export interface Room {
  id: string;
  floor: number;
  number: string;
  capacity: number;
  taken: number;
}

/** A resident as the rooms screen shows them. */
export interface Resident {
  id: string;
  name: string;
  nim: string;
}

export interface PlacedResident extends Resident {
  roomId: string;
}

/**
 * Which residents a read is about: those of one dorm, among the students
 * the account that asks may see.
 */
export interface ResidentScope {
  dorm: DormId;
  dormCohorts: number[];
  /** The student rows the account may see, as a condition. */
  visible: SQL;
}

const RESIDENT = { id: students.id, name: students.name, nim: students.nim };

function inScope(scope: ResidentScope): SQL | undefined {
  return and(scope.visible, livesIn(scope.dorm, scope.dormCohorts));
}

/** Every room of a dorm, by floor and number, in one request. */
export async function readRooms(db: Database, dorm: DormId): Promise<Room[]> {
  return db
    .select({
      id: dormRooms.id,
      floor: dormRooms.floor,
      number: dormRooms.number,
      capacity: dormRooms.capacity,
      taken: count(dormRoomPlaces.studentId),
    })
    .from(dormRooms)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.roomId, dormRooms.id))
    .where(eq(dormRooms.dorm, dorm))
    .groupBy(dormRooms.id)
    .orderBy(asc(dormRooms.floor), asc(dormRooms.number));
}

/** The residents in the rooms of one floor that the account may see. */
export async function readFloorResidents(
  db: Database,
  scope: ResidentScope,
  floor: number,
): Promise<PlacedResident[]> {
  return db
    .select({ ...RESIDENT, roomId: dormRoomPlaces.roomId })
    .from(dormRoomPlaces)
    .innerJoin(dormRooms, eq(dormRooms.id, dormRoomPlaces.roomId))
    .innerJoin(students, eq(students.id, dormRoomPlaces.studentId))
    .where(
      and(
        scope.visible,
        eq(dormRooms.dorm, scope.dorm),
        eq(dormRooms.floor, floor),
      ),
    )
    .orderBy(asc(students.nim));
}

export interface ResidentCounts {
  residents: number;
  placed: number;
}

/** How many residents a dorm has, and how many of them have a room. */
export async function countResidents(
  db: Database,
  scope: ResidentScope,
): Promise<ResidentCounts> {
  const [counted] = await db
    .select({
      residents: count(),
      placed: count(dormRoomPlaces.studentId),
    })
    .from(students)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .where(inScope(scope));
  return counted ?? { residents: 0, placed: 0 };
}

function matchesSearch(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

export interface UnplacedResidents {
  /** The first residents without a room, in NIM order. */
  shown: Resident[];
  /** How many residents without a room match the search in all. */
  matching: number;
}

/**
 * The residents of a dorm without a room whose name or NIM holds the
 * search text: the first of them in NIM order, and how many there are.
 */
export async function listUnplaced(
  db: Database,
  scope: ResidentScope,
  query: string,
): Promise<UnplacedResidents> {
  const rows = await db
    .select({ ...RESIDENT, matching: sql<number>`count(*) over ()` })
    .from(students)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .where(
      and(
        inScope(scope),
        isNull(dormRoomPlaces.studentId),
        matchesSearch(query),
      ),
    )
    .orderBy(asc(students.nim))
    .limit(UNPLACED_SHOWN);
  return {
    shown: rows.map(({ id, name, nim }) => ({ id, name, nim })),
    matching: Number(rows[0]?.matching ?? 0),
  };
}
