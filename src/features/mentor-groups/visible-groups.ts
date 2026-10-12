import { and, inArray, isNull, type SQL, sql } from "drizzle-orm";
import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";
import { mentorGroups } from "@/db/schema";

const NO_GROUP = sql`false`;

/**
 * Which groups an account may read, or null for an account without the
 * right to see groups. Every read of groups takes its limit from here, so
 * that a role which sees every student row but not Pengasuh reads none,
 * and adds none to what another role of the account reads.
 */
export function groupRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "view_mentor_groups")) return null;
  return rowLimitForAction(account, "view_mentor_groups");
}

/**
 * Whether an account with this row limit may see a group of a study
 * program. A limited account sees the groups of its study programs only:
 * its own mentees and its own student open no group here.
 */
export function maySeeGroup(limit: RowLimit, studyProgramId: number): boolean {
  if (limit.kind === "all") return true;
  return limit.studyProgramIds.includes(studyProgramId);
}

/**
 * A group that is in force. One whose penetapan was cancelled is ended:
 * it stays stored, and no read of groups shows it.
 */
export const NOT_ENDED = isNull(mentorGroups.endedAt);

/**
 * The same rule for the `where` of every read of groups, which also
 * leaves out the groups that are ended.
 */
export function groupsVisibleTo(limit: RowLimit): SQL | undefined {
  if (limit.kind === "all") return NOT_ENDED;
  if (limit.studyProgramIds.length === 0) return NO_GROUP;
  return and(
    NOT_ENDED,
    inArray(mentorGroups.studyProgramId, limit.studyProgramIds),
  );
}
