import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";

/**
 * Whether an account may verify attendance: it has the right, through a
 * role that sees every student. Verifying is never limited to some rows,
 * so a role that sees only part of the students would not get it.
 */
export function mayVerify(account: AccountForAccess): boolean {
  if (!may(account.roles, "verify_attendance")) return false;
  return rowLimitForAction(account, "verify_attendance").kind === "all";
}
