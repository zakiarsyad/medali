import { eq } from "drizzle-orm";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { dormCleaningDuties, dormRooms } from "@/db/schema";
import { type RoomInDorm, readOwnRoom } from "@/dorms/student-room";
import { ROOM_OF_DUTY } from "./cleaning-schedule";
import { isOwnRoom } from "./own-record";
import { readStudentDorm } from "./student-dorm";

/**
 * The room a student lives in on `day`, the day on campus: their own in
 * the dorm they live in, or the one they are placed in as kakak
 * pendamping. Null for no student, or one with no room.
 */
export async function readLivedInRoom(
  db: Database,
  studentId: string | null,
  day: string,
): Promise<RoomInDorm | null> {
  if (studentId === null) return null;
  const dorm = await readStudentDorm(db, studentId, day);
  if (dorm === null) return null;
  return readOwnRoom(db, studentId, dorm);
}

/** The room a duty is given to as it is now; null once the room is removed. */
async function readDutyRoom(db: Database, dutyId: string) {
  const [room] = await db
    .select({ dorm: dormRooms.dorm, number: dormRooms.number })
    .from(dormCleaningDuties)
    .innerJoin(dormRooms, ROOM_OF_DUTY)
    .where(eq(dormCleaningDuties.id, dutyId));
  return room ?? null;
}

/**
 * Whether a duty is given to the room the account's own student lives in
 * on `day`: such a duty is judged and cancelled by someone else.
 */
export async function isOwnRoomDuty(
  db: Database,
  actor: Pick<Account, "studentId">,
  dutyId: string,
  day: string,
): Promise<boolean> {
  if (actor.studentId === null) return false;
  const room = await readDutyRoom(db, dutyId);
  if (room === null) return false;
  const lived = await readLivedInRoom(db, actor.studentId, day);
  return isOwnRoom(lived, room);
}
