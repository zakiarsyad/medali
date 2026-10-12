import { and, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, dormRooms, students } from "@/db/schema";
import { dormInSql } from "@/dorms/resident-condition";

/*
 * A stale place belongs to a student who no longer lives in the dorm of
 * their room: one who stopped being a resident, was removed, or now lives
 * in another dorm. A read never deletes one: it leaves it out instead.
 * Only a change that must count the places of a room deletes them, and
 * only those it needs gone, so two changes in two rooms never wait for
 * each other.
 */

async function deleteStale(
  db: Database,
  dormCohorts: number[],
  which: SQL,
): Promise<void> {
  const stale = db
    .select({ studentId: dormRoomPlaces.studentId })
    .from(dormRoomPlaces)
    .innerJoin(dormRooms, eq(dormRooms.id, dormRoomPlaces.roomId))
    .innerJoin(students, eq(students.id, dormRoomPlaces.studentId))
    .where(
      and(
        which,
        sql`${dormInSql(dormCohorts)} is distinct from ${dormRooms.dorm}`,
      ),
    );
  await db
    .delete(dormRoomPlaces)
    .where(inArray(dormRoomPlaces.studentId, stale));
}

/** Deletes the stale places of one room, which the change holds. */
export async function freeStalePlacesIn(
  db: Database,
  dormCohorts: number[],
  roomId: string,
): Promise<void> {
  await deleteStale(db, dormCohorts, eq(dormRoomPlaces.roomId, roomId));
}

/**
 * Deletes the stale places some students still have in any room, so that
 * an old place does not keep them from getting a new one.
 */
export async function freeStalePlacesOf(
  db: Database,
  dormCohorts: number[],
  studentIds: string[],
): Promise<void> {
  if (studentIds.length === 0) return;
  await deleteStale(
    db,
    dormCohorts,
    inArray(dormRoomPlaces.studentId, studentIds),
  );
}
