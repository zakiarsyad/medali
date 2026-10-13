import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";

/**
 * Which students' mentoring notes an account may read, or null for an
 * account without the right to read notes. Every read of notes takes its
 * limit from here, on the tab and in a student's detail alike, so a role
 * that sees students but not notes is shown none.
 */
export function noteRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "view_mentoring_notes")) return null;
  return rowLimitForAction(account, "view_mentoring_notes");
}

/**
 * Which students an account may write a note for, or null for an account
 * without the right to write: only Pengasuh writes. A role of the account
 * that only reads notes adds no student here.
 */
export function writtenRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "write_mentoring_notes")) return null;
  return rowLimitForAction(account, "write_mentoring_notes");
}
