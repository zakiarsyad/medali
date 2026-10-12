import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, dormRooms } from "@/db/schema";
import { DORM_NAMES, type DormId } from "./dorms";

export interface StudentRoom {
  floor: number;
  number: string;
}

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

/** Where a resident lives, as the Asrama page header says it. */
export function roomHeader(dorm: DormId, room: StudentRoom | null): string {
  if (!room) return "Belum diplot";
  return `${DORM_NAMES[dorm]}, lantai ${room.floor}, kamar ${room.number}`;
}
