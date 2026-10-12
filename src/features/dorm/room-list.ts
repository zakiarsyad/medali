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

/*
 * A place counts only while its student lives in the dorm of the room. A
 * place left behind by a student who stopped being a resident, or who now
 * lives in another dorm, is left out by every read here, so it shows as
 * free. No read deletes anything.
 */

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

/** The join that finds the room a student has in one dorm, if any. */
export function roomIn(dorm: DormId): SQL | undefined {
  return and(eq(dormRooms.id, dormRoomPlaces.roomId), eq(dormRooms.dorm, dorm));
}

/**
 * Every room of a dorm, by floor and number, in one request. The places
 * taken are those of students who live in the dorm now.
 */
export async function readRooms(
  db: Database,
  dorm: DormId,
  dormCohorts: number[],
): Promise<Room[]> {
  return db
    .select({
      id: dormRooms.id,
      floor: dormRooms.floor,
      number: dormRooms.number,
      capacity: dormRooms.capacity,
      taken: count(students.id),
    })
    .from(dormRooms)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.roomId, dormRooms.id))
    .leftJoin(
      students,
      and(
        eq(students.id, dormRoomPlaces.studentId),
        livesIn(dorm, dormCohorts),
      ),
    )
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
        inScope(scope),
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

/** How many residents a dorm has, and how many of them have a room in it. */
export async function countResidents(
  db: Database,
  scope: ResidentScope,
): Promise<ResidentCounts> {
  const [counted] = await db
    .select({ residents: count(), placed: count(dormRooms.id) })
    .from(students)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(dormRooms, roomIn(scope.dorm))
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
 * The residents of a dorm without a room in it whose name or NIM holds
 * the search text: the first of them in NIM order, and how many there are.
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
    .leftJoin(dormRooms, roomIn(scope.dorm))
    .where(and(inScope(scope), isNull(dormRooms.id), matchesSearch(query)))
    .orderBy(asc(students.nim))
    .limit(UNPLACED_SHOWN);
  return {
    shown: rows.map(({ id, name, nim }) => ({ id, name, nim })),
    matching: Number(rows[0]?.matching ?? 0),
  };
}
