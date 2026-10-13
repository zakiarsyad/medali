import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";

/**
 * Which groups' meetings and attendance an account may read, or null for
 * an account without the right to read attendance. Every read of
 * meetings takes its limit from here, so a role that sees groups but not
 * attendance is shown none.
 */
export function attendanceRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "view_mentoring_attendance")) return null;
  return rowLimitForAction(account, "view_mentoring_attendance");
}

/**
 * Which groups an account may fill in an attendance list for, or null
 * for an account without the right to fill in: only Pengasuh does. A role
 * of the account that only reads attendance adds no group here.
 */
export function filledRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "fill_mentoring_attendance")) return null;
  return rowLimitForAction(account, "fill_mentoring_attendance");
}
