import { sql } from "drizzle-orm";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
} from "@/db/schema";

/**
 * The name of today's mentor of the group in force a student is in, or
 * none, for the `select` of a read of students.
 */
export const MENTOR_NAME = sql<string | null>`(
  select ${accounts.name} from ${mentorGroupMembers}
  inner join ${mentorGroups}
    on ${mentorGroups.id} = ${mentorGroupMembers.groupId}
    and ${mentorGroups.endedAt} is null
  inner join ${mentorGroupMentors}
    on ${mentorGroupMentors.groupId} = ${mentorGroups.id}
    and ${mentorGroupMentors.endsOn} is null
  inner join ${accounts} on ${accounts.id} = ${mentorGroupMentors.mentorId}
  where ${mentorGroupMembers.studentId} = ${students.id}
  limit 1
)`;
