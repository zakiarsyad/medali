import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";

/**
 * Which evaluations of mentors an account may read, by the groups they
 * are of, or null for an account without the right to see them. Every
 * read of evaluations takes its limit from here, on the tab and on the
 * screens of groups and mentors alike, so a role that sees groups but not
 * evaluations is shown none.
 */
export function evaluationRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "view_mentor_evaluations")) return null;
  return rowLimitForAction(account, "view_mentor_evaluations");
}

/**
 * Which groups an account may evaluate the mentor of, or null for an
 * account without the right to evaluate.
 */
export function evaluatedRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "evaluate_mentors")) return null;
  return rowLimitForAction(account, "evaluate_mentors");
}
