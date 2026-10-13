import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";

/**
 * Which groups' mentoring scores an account may read, or null for an
 * account without the right to read them. Every read of scores takes its
 * limit from here, so a role that sees groups but not scores is shown
 * none.
 */
export function scoreRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "view_mentoring_scores")) return null;
  return rowLimitForAction(account, "view_mentoring_scores");
}

/**
 * Which groups an account may give mentoring scores in, or null for an
 * account without the right to give them: only Pengasuh does. A role of
 * the account that only reads scores adds no group here.
 */
export function givenRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "give_mentoring_scores")) return null;
  return rowLimitForAction(account, "give_mentoring_scores");
}
