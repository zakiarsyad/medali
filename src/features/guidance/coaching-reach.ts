import type { SQL } from "drizzle-orm";
import {
  type AccountForAccess,
  may,
  mayOpenTab,
  type RowLimit,
  rowLimitForAction,
  rowLimitForTab,
} from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";

/**
 * Which students Pembinaan karakter may show the account: the rows of
 * each of its roles that opens the tab. Null for an account without it.
 */
export function coachingLimitOf(actor: AccountForAccess): RowLimit | null {
  if (!mayOpenTab(actor.roles, "guidance", "character")) return null;
  return rowLimitForTab(actor, "guidance", "character");
}

/** The same, for the `where` of a read of students. */
export function coachingReachOf(actor: AccountForAccess): SQL | null {
  const limit = coachingLimitOf(actor);
  return limit === null ? null : visibleTo(limit);
}

/**
 * Which students the account may change the coaching status of: the
 * rows of only its roles with that right. Null for an account without it.
 */
export function coachingChangeReachOf(actor: AccountForAccess): SQL | null {
  if (!may(actor.roles, "change_coaching_status")) return null;
  return visibleTo(rowLimitForAction(actor, "change_coaching_status"));
}
