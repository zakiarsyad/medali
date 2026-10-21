import type { SQL } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";

/** Which students the numbers of an account's Dashboard count. */
export interface DashboardScope {
  /** The students the account sees there, before any filter. */
  visible: SQL;
  /**
   * Whether the account may pick a program studi: only one that sees every
   * student. Ketua Program Studi sees their own program only.
   */
  picksProgram: boolean;
}

/**
 * The scope of the Dashboard for an account, or null for one without the
 * right to it. No number of the Dashboard is read without a scope.
 */
export function dashboardScopeOf(
  account: AccountForAccess,
): DashboardScope | null {
  if (!may(account.roles, "view_character_dashboard")) return null;
  const limit = rowLimitForAction(account, "view_character_dashboard");
  return { visible: visibleTo(limit), picksProgram: limit.kind === "all" };
}
