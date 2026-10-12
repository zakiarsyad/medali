import { inArray, type SQL, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";

/**
 * Which penetapan rows an account may read, or null for an account
 * without the right to see penetapan. Every read here takes its limit
 * from this, so a request made by hand reads nothing without the right.
 */
export function assignmentRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "view_cohort_assignments")) return null;
  return rowLimitForAction(account, "view_cohort_assignments");
}

/** A limit that leaves nothing out: what a save reads, whoever saves. */
export const EVERY_ROW: RowLimit = { kind: "all" };

/** Whether the limit holds an account to the rows of its study programs. */
export function isLimited(limit: RowLimit): boolean {
  return limit.kind !== "all";
}

/**
 * The `where` part that keeps a read to the study programs of a limit.
 * `programId` is the column that names the study program of a row. A
 * limited account without a study program reads nothing.
 */
export function inProgramsOf(limit: RowLimit, programId: AnyPgColumn): SQL {
  if (limit.kind === "all") return sql`true`;
  if (limit.studyProgramIds.length === 0) return sql`false`;
  return inArray(programId, limit.studyProgramIds);
}
