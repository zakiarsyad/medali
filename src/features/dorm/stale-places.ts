import { eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, dormRooms, students } from "@/db/schema";
import { dormInSql } from "./resident-condition";

/**
 * Deletes the room place of every student who no longer lives in the dorm
 * of their room: one who stopped being a resident, was removed, or now
 * lives in another dorm. Only a change that must count the places of a
 * room runs this, while it holds the room. A read never does: it leaves
 * those places out instead.
 *
 * Nothing is deleted when no academic period runs (the angkatan years are
 * null): nobody's semester is known then, and a mistake in the periods
 * must not empty the rooms.
 */
export async function freeStalePlaces(
  db: Database,
  dormCohorts: number[] | null,
): Promise<void> {
  if (dormCohorts === null) return;
  const stale = db
    .select({ studentId: dormRoomPlaces.studentId })
    .from(dormRoomPlaces)
    .innerJoin(dormRooms, eq(dormRooms.id, dormRoomPlaces.roomId))
    .innerJoin(students, eq(students.id, dormRoomPlaces.studentId))
    .where(sql`${dormInSql(dormCohorts)} is distinct from ${dormRooms.dorm}`);
  await db
    .delete(dormRoomPlaces)
    .where(inArray(dormRoomPlaces.studentId, stale));
}
