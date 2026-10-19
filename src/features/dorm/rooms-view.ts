import type { SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { hasCompanions } from "./companion-dorms";
import { listNonResidents, type NonResidents } from "./non-residents";
import { type RoomCompanions, readRoomCompanions } from "./room-companions";
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
  /** The kakak pendamping of the dorm. Null for a dorm that has none. */
  companions: RoomCompanions | null;
}

function readCompanions(
  db: Database,
  params: RoomsParams,
  visible: SQL,
): Promise<RoomCompanions | null> {
  const { dorm, floor } = params;
  if (!hasCompanions(dorm)) return Promise.resolve(null);
  return readRoomCompanions(db, { dorm, visible }, floor);
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
  const [rooms, residents, counts, unplaced, companions] = await Promise.all([
    readRooms(db, params.dorm, dormCohorts),
    readFloorResidents(db, scope, params.floor),
    countResidents(db, scope),
    listUnplaced(db, scope, params.query),
    readCompanions(db, params, visible),
  ]);
  return {
    periodRuns: cohorts !== null,
    rooms,
    residents,
    counts,
    unplaced,
    companions,
  };
}

/**
 * The students the form "Tambah penghuni" offers on a day, today when none
 * is given, found by the search text. Null while no academic period runs:
 * who lives in no dorm cannot be told then.
 */
export async function loadNonResidents(
  db: Database,
  query: string,
  visible: SQL,
  day?: string,
): Promise<NonResidents | null> {
  const dormCohorts = await readDormCohorts(db, day);
  if (dormCohorts === null) return null;
  return listNonResidents(db, { dormCohorts, visible }, query);
}
