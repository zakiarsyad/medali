import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const EVALUATION_ADDRESS = "/pengasuh/ganti";

/** The part of the address that names the group chosen on the form. */
export const CHOSEN_GROUP_PARAM = "kelompok";

/**
 * The group the address asks the form for, or null when it names none.
 * Nothing in an address is trusted: what has not the shape of a row id
 * counts as not asked.
 */
export function readChosenGroup(params: SearchParams): string | null {
  const asked = firstParam(params[CHOSEN_GROUP_PARAM]).trim();
  return isUuid(asked) ? asked : null;
}

/** The address of the tab with the form open for one group. */
export function evaluationAddress(groupId: string): string {
  const params = new URLSearchParams({ [CHOSEN_GROUP_PARAM]: groupId });
  return `${EVALUATION_ADDRESS}?${params}`;
}
