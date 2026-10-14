import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const CLEANING_ADDRESS = "/asrama/bersih";

/** What the Pembersihan asrama screen shows. */
export interface CleaningParams {
  /** The dorm the switch shows, or null for Semua asrama. */
  dorm: DormId | null;
}

/**
 * What the address asks the screen for. Nothing in an address is trusted:
 * a dorm that is not understood counts as Semua asrama.
 */
export function readCleaningParams(params: SearchParams): CleaningParams {
  const dorm = firstParam(params.asrama);
  return { dorm: DORM_IDS.find((id) => id === dorm) ?? null };
}

/** The dorms the screen shows: the one picked, or all four. */
export function shownDorms(params: CleaningParams): readonly DormId[] {
  return params.dorm === null ? DORM_IDS : [params.dorm];
}

/** The address of the screen. Semua asrama is left out. */
export function cleaningAddress({ dorm }: CleaningParams): string {
  const params = new URLSearchParams();
  if (dorm !== null) params.set("asrama", dorm);
  const text = params.toString();
  return text === "" ? CLEANING_ADDRESS : `${CLEANING_ADDRESS}?${text}`;
}
