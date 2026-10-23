import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, dormRooms, students } from "@/db/schema";
import type { DormId } from "./dorms";
import { dormInSql, isPlaceRoomOf } from "./resident-condition";
import type { RoomInDorm } from "./student-room";

/** Where a student lives: their dorm and their room there, each null without one. */
export interface ResidentPlace {
  dorm: DormId | null;
  room: RoomInDorm | null;
}

/**
 * Where each of a few students lives, by student, in one read: the dorm
 * the usual rules give them and their resident place in it. The angkatan
 * years given are those in a semester that lives in the dorm.
 */
export async function readResidentPlaces(
  db: Database,
  studentIds: readonly string[],
  dormCohorts: number[],
): Promise<Map<string, ResidentPlace>> {
  if (studentIds.length === 0) return new Map();
  const dorm = dormInSql(dormCohorts);
  const rows = await db
    .select({
      id: students.id,
      dorm,
      floor: dormRooms.floor,
      number: dormRooms.number,
    })
    .from(students)
    .leftJoin(dormRoomPlaces, eq(dormRoomPlaces.studentId, students.id))
    .leftJoin(
      dormRooms,
      and(eq(dormRooms.id, dormRoomPlaces.roomId), isPlaceRoomOf(dorm)),
    )
    .where(inArray(students.id, [...studentIds]));
  const places = new Map<string, ResidentPlace>();
  for (const row of rows) places.set(row.id, placeOf(row));
  return places;
}

function placeOf(row: {
  dorm: DormId | null;
  floor: number | null;
  number: string | null;
}): ResidentPlace {
  const { dorm, floor, number } = row;
  if (dorm === null || floor === null || number === null) {
    return { dorm, room: null };
  }
  return { dorm, room: { dorm, floor, number } };
}
