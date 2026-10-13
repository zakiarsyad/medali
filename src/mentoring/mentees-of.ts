import { and, inArray, isNull, type SQL, sql } from "drizzle-orm";
import { mentorGroupMembers, mentorGroupMentors, students } from "@/db/schema";

/**
 * The members of the groups these mentors hold today, for the `where` of
 * a read of students. A mentor line that has ended opens nothing, so a
 * group held before stays closed. No mentor gives no condition.
 */
export function menteesOf(mentorIds: string[]): SQL | undefined {
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
