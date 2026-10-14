import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import { readRooms } from "./room-list";

/** A room that has residents today, which can be given a cleaning duty. */
export interface OccupiedRoom {
  id: string;
  number: string;
  /** The number Ploting kamar shows for the room today. */
  residents: number;
}

/**
 * The rooms of a dorm that someone lives in, by floor and number. A room
 * with no one in it gets no duty.
 */
export async function readOccupiedRooms(
  db: Database,
  dorm: DormId,
  dormCohorts: number[],
): Promise<OccupiedRoom[]> {
  const rooms = await readRooms(db, dorm, dormCohorts);
  return rooms
    .filter((room) => room.taken > 0)
    .map(({ id, number, taken }) => ({ id, number, residents: taken }));
}

/**
 * The occupied rooms of each dorm asked for, counted today. While no
 * academic period runs only Internasional and Pembibitan students count
 * as residents, as on Ploting kamar.
 */
export async function readOccupiedRoomsOf(
  db: Database,
  dorms: readonly DormId[],
): Promise<Map<DormId, OccupiedRoom[]>> {
  const dormCohorts = (await readDormCohorts(db)) ?? [];
  const found = await Promise.all(
    dorms.map((dorm) => readOccupiedRooms(db, dorm, dormCohorts)),
  );
  return new Map(dorms.map((dorm, at) => [dorm, found[at] ?? []]));
}
