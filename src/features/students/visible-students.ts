import { and, inArray, isNull, or, type SQL, sql } from "drizzle-orm";
import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
} from "@/auth/access";
import { mentorGroupMembers, mentorGroupMentors, students } from "@/db/schema";
import { NOT_REMOVED } from "./student-conditions";

const NOBODY = sql`false`;

function inPrograms(ids: number[]): SQL | undefined {
  return ids.length > 0 ? inArray(students.studyProgramId, ids) : undefined;
}

function themselves(ids: string[]): SQL | undefined {
  return ids.length > 0 ? inArray(students.id, ids) : undefined;
}

/**
 * The members of the groups these mentors hold today. A mentor line
 * that has ended opens nothing, so a group held before stays closed.
 */
function menteesOf(mentorIds: string[]): SQL | undefined {
  if (mentorIds.length === 0) return undefined;
  const heldToday = and(
    inArray(mentorGroupMentors.mentorId, mentorIds),
    isNull(mentorGroupMentors.endsOn),
  );
  return sql`exists (
    select 1 from ${mentorGroupMembers}
    inner join ${mentorGroupMentors}
      on ${mentorGroupMentors.groupId} = ${mentorGroupMembers.groupId}
    where ${mentorGroupMembers.studentId} = ${students.id} and ${heldToday}
  )`;
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
