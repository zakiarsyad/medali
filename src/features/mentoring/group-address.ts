import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";

/** The part of the address that names the group a tab shows. */
export const GROUP_PARAM = "kelompok";

/**
 * The group an address asks a tab for, or null when it names none. What
 * has not the shape of a row id names no group.
 */
export function askedGroupId(params: SearchParams): string | null {
  const groupId = firstParam(params[GROUP_PARAM]).trim();
  return isUuid(groupId) ? groupId : null;
}

/** The address of a tab of Pengasuhan showing one group. */
export function groupTabAddress(tabAddress: string, groupId: string): string {
  const params = new URLSearchParams({ [GROUP_PARAM]: groupId });
  return `${tabAddress}?${params}`;
}
