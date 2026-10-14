import { and, inArray, isNull, or, type SQL, sql } from "drizzle-orm";
import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";
import { students } from "@/db/schema";
import { menteesOf } from "@/mentoring/mentees-of";

const NOBODY = sql`false`;

/** A student who was not removed: the record is kept, and seen by nobody. */
export const NOT_REMOVED = isNull(students.deletedAt);

function inPrograms(ids: number[]): SQL | undefined {
  return ids.length > 0 ? inArray(students.studyProgramId, ids) : undefined;
}

function themselves(ids: string[]): SQL | undefined {
  return ids.length > 0 ? inArray(students.id, ids) : undefined;
}

/**
 * The students an account may see, for the `where` of every read of
 * student rows. A removed student is seen by nobody.
 */
export function visibleTo(limit: RowLimit): SQL {
  if (limit.kind === "all") return NOT_REMOVED;
  const allowed = or(
    inPrograms(limit.studyProgramIds),
    menteesOf(limit.menteesOf),
    themselves(limit.studentIds),
  );
  return and(NOT_REMOVED, allowed ?? NOBODY) ?? NOBODY;
}

/**
 * The students whose detail an account may open, or null for an account
 * without the right to a detail. Only the roles that give that right
 * count: a role that sees every student on its own screens opens no
 * detail here.
 */
export function detailVisibleTo(account: AccountForAccess): SQL | null {
  if (!may(account.roles, "view_student_detail")) return null;
  return visibleTo(rowLimitForAction(account, "view_student_detail"));
}
