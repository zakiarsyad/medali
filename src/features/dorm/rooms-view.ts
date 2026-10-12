import type { SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { readDormCohorts } from "./dorm-cohorts";
import {
  countResidents,
  listUnplaced,
  type PlacedResident,
  type ResidentCounts,
  type ResidentScope,
  type Room,
  readFloorResidents,
  readRooms,
  type UnplacedResidents,
} from "./room-list";
import type { RoomsParams } from "./rooms-address";

/** What the Ploting kamar screen shows for one dorm and floor. */
export interface RoomsView {
  /** Whether an academic period runs. Without one no room can be plotted. */
  periodRuns: boolean;
  /** Every room of the dorm. */
  rooms: Room[];
  /** The residents in the rooms of the open floor. */
  residents: PlacedResident[];
  counts: ResidentCounts;
  unplaced: UnplacedResidents;
}

/**
 * Reads what the screen shows on a day, today when none is given. It only
 * reads: opening the screen changes nothing. When no academic period runs
 * no angkatan counts as living in the dorm.
 */
export async function loadRooms(
  db: Database,
  params: RoomsParams,
  visible: SQL,
  day?: string,
): Promise<RoomsView> {
  const cohorts = await readDormCohorts(db, day);
  const dormCohorts = cohorts ?? [];
  const scope: ResidentScope = { dorm: params.dorm, dormCohorts, visible };
  const [rooms, residents, counts, unplaced] = await Promise.all([
    readRooms(db, params.dorm, dormCohorts),
    readFloorResidents(db, scope, params.floor),
    countResidents(db, scope),
    listUnplaced(db, scope, params.query),
  ]);
  return { periodRuns: cohorts !== null, rooms, residents, counts, unplaced };
}
