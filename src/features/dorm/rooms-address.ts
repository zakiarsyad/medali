import { firstParam, type SearchParams } from "@/ui/search-params";
import { DORM_IDS, type DormId } from "./dorms";
import { FIRST_FLOOR, FLOORS, SEARCH_MAX_LENGTH } from "./room-limits";

export const ROOMS_ADDRESS = "/asrama/kamar";

/** What the Ploting kamar screen shows. */
export interface RoomsParams {
  dorm: DormId;
  floor: number;
  /** The text the list "Belum diplot" is searched for. */
  query: string;
}

const FIRST_DORM: DormId = "wismantara_putra";

function readFloor(text: string): number {
  return FLOORS.find((floor) => String(floor) === text) ?? FIRST_FLOOR;
}

/**
 * What the address asks the screen for. Nothing in an address is trusted:
 * a dorm or a floor that is not understood counts as the first one.
 */
export function readRoomsParams(params: SearchParams): RoomsParams {
  const dorm = firstParam(params.asrama);
  return {
    dorm: DORM_IDS.find((id) => id === dorm) ?? FIRST_DORM,
    floor: readFloor(firstParam(params.lantai)),
    query: firstParam(params.q).trim().slice(0, SEARCH_MAX_LENGTH),
  };
}

/** The address of the screen for a dorm and a floor, with no search. */
export function roomsAddress(dorm: DormId, floor: number): string {
  const params = new URLSearchParams({ asrama: dorm, lantai: String(floor) });
  return `${ROOMS_ADDRESS}?${params}`;
}
