import { eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, dormRooms, students } from "@/db/schema";
import { dormInSql } from "./resident-condition";

/**
 * Frees the room place of every student who no longer lives in the dorm
 * of their room: one who stopped being a resident, was removed, or now
 * lives in another dorm. Run before rooms are read or filled, so a place
 * left behind is free on the next load.
 */
export async function freeStalePlaces(
  db: Database,
  dormCohorts: number[],
): Promise<void> {
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
