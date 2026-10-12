import { firstParam, type SearchParams } from "@/ui/search-params";
import { cohortYearOf } from "./forming-input";

export const ASSIGNMENT_ADDRESS = "/pengasuh/tetap";

/**
 * The angkatan the address asks for, or null when it names none. Nothing
 * in an address is trusted: what is no year counts as not asked.
 */
export function readAskedCohort(params: SearchParams): number | null {
  return cohortYearOf(firstParam(params.angkatan));
}

/** The address of the tab with one angkatan chosen. */
export function cohortAddress(cohortYear: number): string {
  const params = new URLSearchParams({ angkatan: String(cohortYear) });
  return `${ASSIGNMENT_ADDRESS}?${params}`;
}
