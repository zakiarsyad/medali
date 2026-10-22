import type { SQL } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import { sharedReachOf } from "@/features/counselling/shared-reach";

/** Who reads the counselling data published to them, and which sharings they reach. */
export interface SharedReader {
  /** The account, written to the log of readings for each row shown. */
  readerId: string;
  /** The published sharings it reaches, on the sharings joined with their students. */
  reach: SQL;
}

/** Which students the numbers of an account's Dashboard count. */
export interface DashboardScope {
  /** The students the account sees there, before any filter. */
  visible: SQL;
  /**
   * Whether the account may pick a program studi: only one that sees every
   * student. Ketua Program Studi sees their own program only.
   */
  picksProgram: boolean;
  /**
   * The students whose illnesses the account may count, or null for one
   * that may not: only who reads the recap of every student's health.
   */
  illnesses: SQL | null;
  /**
   * The counselling data published to the account's Dashboard roles, or
   * null for one that may read none.
   */
  shared: SharedReader | null;
}

function illnessesOf(account: AccountForAccess): SQL | null {
  if (!may(account.roles, "view_health_recap")) return null;
  return visibleTo(rowLimitForAction(account, "view_health_recap"));
}

/**
 * Only the sharings named to a role that opens the Dashboard, so a
 * person who is also Pengasuh gets no row of their mentees here.
 */
function sharedOf(account: AccountForAccess): SharedReader | null {
  const roles = account.roles.filter((role) =>
    may([role], "view_character_dashboard"),
  );
  const reach = sharedReachOf({ ...account, roles });
  if (reach === null) return null;
  return { readerId: account.id, reach };
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
  return {
    visible: visibleTo(limit),
    picksProgram: limit.kind === "all",
    illnesses: illnessesOf(account),
    shared: sharedOf(account),
  };
}
