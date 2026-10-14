import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";

/**
 * Whether an account may decide clarifications and open their files: it
 * has the right, through a role that sees every student. Deciding is
 * never limited to some rows, so a role that sees only part of the
 * students would not get it.
 */
export function mayDecideClarifications(account: AccountForAccess): boolean {
  if (!may(account.roles, "decide_activity_clarifications")) return false;
  const limit = rowLimitForAction(account, "decide_activity_clarifications");
  return limit.kind === "all";
}
