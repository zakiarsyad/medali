import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";

/**
 * Which groups an account may replace the mentor of, or null for an
 * account without the right to set and cancel a replacement.
 */
export function replacedRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "replace_mentors")) return null;
  return rowLimitForAction(account, "replace_mentors");
}
