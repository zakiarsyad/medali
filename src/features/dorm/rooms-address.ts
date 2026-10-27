import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { withoutNullCharacter } from "@/ui/search-text";
import { FIRST_FLOOR, FLOORS, SEARCH_MAX_LENGTH } from "./room-limits";

export const ROOMS_ADDRESS = "/asrama/kamar";

/** What the Ploting kamar screen shows. */
export interface RoomsParams {
  dorm: DormId;
  floor: number;
  /** The text the list "Belum diplot" is searched for. */
  query: string;
  /**
   * The text the form "Tambah penghuni" searches students for, empty for
   * none. Null while the form is closed.
   */
  adding: string | null;
}

/** The part of the address that opens the form "Tambah penghuni". */
const ADDING = "1";

function readSearch(value: string | string[] | undefined): string {
  return withoutNullCharacter(firstParam(value))
    .trim()
    .slice(0, SEARCH_MAX_LENGTH);
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
    query: readSearch(params.q),
    adding:
      firstParam(params.tambah) === ADDING ? readSearch(params.cari) : null,
  };
}

/** The address of the screen for a dorm and a floor, with no search. */
export function roomsAddress(dorm: DormId, floor: number): string {
  const params = new URLSearchParams({ asrama: dorm, lantai: String(floor) });
  return `${ROOMS_ADDRESS}?${params}`;
}

/** The address of the screen for a dorm and a floor, with "Tambah penghuni" open. */
export function addingAddress(dorm: DormId, floor: number): string {
  return `${roomsAddress(dorm, floor)}&tambah=${ADDING}`;
}
