import { database } from "@/db/database";
import { readStudentRoom, roomHeader } from "@/dorms/student-room";
import { currentDorm } from "./current-dorm";

/**
 * The room line for the Asrama page header of the account's student. Null
 * for an account whose student does not live in a dorm, or that has none.
 */
export async function residentHeader(
  studentId: string | null,
): Promise<string | null> {
  const dorm = await currentDorm(studentId);
  if (studentId === null || dorm === null) return null;
  return roomHeader(dorm, await readStudentRoom(database(), studentId, dorm));
}
