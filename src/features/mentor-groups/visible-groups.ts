import { inArray, type SQL, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import { mentorGroups } from "@/db/schema";

const NO_GROUP = sql`false`;

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
 * The same rule for the `where` of every read of groups. Nothing to add
 * for an account that sees every group.
 */
export function groupsVisibleTo(limit: RowLimit): SQL | undefined {
  if (limit.kind === "all") return undefined;
  if (limit.studyProgramIds.length === 0) return NO_GROUP;
  return inArray(mentorGroups.studyProgramId, limit.studyProgramIds);
}
