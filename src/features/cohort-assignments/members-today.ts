import { eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  mentorGroupMembers,
} from "@/db/schema";

/**
 * The members each group of a penetapan has today, as a part of a read.
 * A group that became a kelompok pengasuhan in force, which is every
 * group of a fixed penetapan and no other, has the members of that
 * kelompok: a student placed, moved or taken out on Pengguna baru
 * mahasiswa after the penetapan is read where they are now. Any other
 * group has the members that were prepared for it.
 */
export function membersToday(db: Database) {
  const prepared = db
    .select({
      groupId: cohortAssignmentMembers.groupId,
      studentId: cohortAssignmentMembers.studentId,
    })
    .from(cohortAssignmentMembers)
    .innerJoin(
      cohortAssignmentGroups,
      eq(cohortAssignmentGroups.id, cohortAssignmentMembers.groupId),
    )
    .where(isNull(cohortAssignmentGroups.mentorGroupId));
  const inForce = db
    .select({
      groupId: cohortAssignmentGroups.id,
      studentId: mentorGroupMembers.studentId,
    })
    .from(mentorGroupMembers)
    .innerJoin(
      cohortAssignmentGroups,
      eq(cohortAssignmentGroups.mentorGroupId, mentorGroupMembers.groupId),
    );
  return prepared.unionAll(inForce).as("members_today");
}
