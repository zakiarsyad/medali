import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormCompanions, dormRoomPlaces, dormRooms } from "@/db/schema";
import { DORM_NAMES, type DormId } from "./dorms";

export interface StudentRoom {
  floor: number;
  number: string;
}

/** A room with its dorm, as a message names where a student is placed. */
export interface RoomInDorm extends StudentRoom {
  dorm: DormId;
}

/**
 * The one room a student has: their own in the dorm they live in, or the
 * room they are placed in as kakak pendamping.
 */
export type OwnRoom = RoomInDorm & { asCompanion: boolean };

/**
 * The room a resident has in the dorm they live in, or null without one.
 * A place left behind in another dorm does not count.
 */
export async function readStudentRoom(
  db: Database,
  studentId: string,
  dorm: DormId,
): Promise<StudentRoom | null> {
  const [room] = await db
    .select({ floor: dormRooms.floor, number: dormRooms.number })
    .from(dormRoomPlaces)
    .innerJoin(dormRooms, eq(dormRooms.id, dormRoomPlaces.roomId))
    .where(
      and(eq(dormRoomPlaces.studentId, studentId), eq(dormRooms.dorm, dorm)),
    )
    .limit(1);
  return room ?? null;
}

/**
 * The room a student is placed in as kakak pendamping, or null without
 * one. Only an active one has a room: Nonaktifkan takes it away.
 */
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

/**
 * The room of a resident of `dorm`: their own room there, else the room
 * they are placed in as kakak pendamping, else null.
 */
export async function readOwnRoom(
  db: Database,
  studentId: string,
  dorm: DormId,
): Promise<OwnRoom | null> {
  const room = await readStudentRoom(db, studentId, dorm);
  if (room) return { dorm, ...room, asCompanion: false };
  const companionRoom = await readCompanionRoom(db, studentId);
  if (!companionRoom) return null;
  return { ...companionRoom, asCompanion: true };
}

/** Where a resident lives, as the Asrama page header says it. */
export function roomHeader(dorm: DormId, room: StudentRoom | null): string {
  if (!room) return "Belum diplot";
  return `${DORM_NAMES[dorm]}, lantai ${room.floor}, kamar ${room.number}`;
}

/** A student's own room, marked when it is a kakak pendamping room. */
export function ownRoomWords(room: OwnRoom | null): string {
  if (!room) return "Belum diplot";
  const words = roomHeader(room.dorm, room);
  if (!room.asCompanion) return words;
  return `${words} (kakak pendamping)`;
}
