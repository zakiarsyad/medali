import { isUuid } from "@/db/is-uuid";
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

/**
 * The group whose members the address asks to show, or null when it
 * names none. What has not the shape of a row id counts as not asked.
 */
export function readAskedGroup(params: SearchParams): string | null {
  const asked = firstParam(params.kelompok);
  return isUuid(asked) ? asked : null;
}

/**
 * The address of the tab with one angkatan chosen, and with the members
 * of one of its groups shown when a group is named.
 */
export function cohortAddress(
  cohortYear: number,
  openGroupId: string | null = null,
): string {
  const params = new URLSearchParams({ angkatan: String(cohortYear) });
  if (openGroupId !== null) params.set("kelompok", openGroupId);
  return `${ASSIGNMENT_ADDRESS}?${params}`;
}
