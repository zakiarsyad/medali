import { and, asc, eq, inArray, or, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormRoomPlaces, dormRooms, students } from "@/db/schema";
import { roomDormInSql } from "@/dorms/resident-condition";

/*
 * A stale place belongs to a student who no longer lives in the dorm of
 * their room: one who stopped being a resident, was removed, now lives
 * in another dorm, or is an Aktif kakak pendamping, who has the room of
 * their duty instead. A read never deletes one: it leaves it out instead.
 * Only a change that must count the places of a room deletes them, and
 * only those it needs gone. Every such change holds the places it deletes
 * in one go, in the order of the student, so two changes that need some
 * of the same places gone take them one after the other, and never each
 * hold one the other waits for.
 */

function isStale(dormCohorts: number[]): SQL {
  return sql`${roomDormInSql(dormCohorts)} is distinct from ${dormRooms.dorm}`;
}

async function lockStale(
  db: Database,
  dormCohorts: number[],
  which: SQL | undefined,
): Promise<string[]> {
  const stale = await db
    .select({ studentId: dormRoomPlaces.studentId })
    .from(dormRoomPlaces)
    .innerJoin(dormRooms, eq(dormRooms.id, dormRoomPlaces.roomId))
    .innerJoin(students, eq(students.id, dormRoomPlaces.studentId))
    .where(and(which, isStale(dormCohorts)))
    // The database holds the rows in the order they are sorted in.
    .orderBy(asc(dormRoomPlaces.studentId))
    .for("update", { of: dormRoomPlaces });
  return stale.map((place) => place.studentId);
}

async function deleteStale(
  db: Database,
  dormCohorts: number[],
  which: SQL | undefined,
): Promise<void> {
  const studentIds = await lockStale(db, dormCohorts, which);
  if (studentIds.length === 0) return;
  await db
    .delete(dormRoomPlaces)
    .where(inArray(dormRoomPlaces.studentId, studentIds));
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
 * Deletes the stale places of one room, which the change holds, and those
 * the students it places still have in any room, so that an old place
 * does not keep them from getting a new one. The students are held first.
 */
export async function freeStalePlaces(
  db: Database,
  dormCohorts: number[],
  roomId: string,
  studentIds: string[],
): Promise<void> {
  await deleteStale(
    db,
    dormCohorts,
    or(
      eq(dormRoomPlaces.roomId, roomId),
      inArray(dormRoomPlaces.studentId, studentIds),
    ),
  );
}
