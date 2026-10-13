import { sql } from "drizzle-orm";
import { mentorGroupMembers, mentorGroups, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "./active-member";

/** How many Aktif students a group holds, in a read of groups. */
export const MEMBERS = sql`(
  select count(*) from ${mentorGroupMembers}
  inner join ${students} on ${students.id} = ${mentorGroupMembers.studentId}
  where ${mentorGroupMembers.groupId} = ${mentorGroups.id}
    and ${ACTIVE_MEMBER}
)`.mapWith(Number);
