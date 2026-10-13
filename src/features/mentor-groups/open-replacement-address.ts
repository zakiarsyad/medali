import { type AccountForAccess, mayOpenTab } from "@/auth/access";
import { replacementAddress } from "./evaluation-address";
import { replacedRowsFor } from "./visible-replacements";

/**
 * The address of the form that replaces the mentor of a group, for an
 * account that may set a replacement and may open the tab the form is on,
 * or null for any other: the page of a group shows its button only with
 * this.
 */
export function openReplacementAddress(
  account: AccountForAccess,
  groupId: string,
): string | null {
  if (replacedRowsFor(account) === null) return null;
  if (!mayOpenTab(account.roles, "mentors", "replacement")) return null;
  return replacementAddress(groupId);
}
