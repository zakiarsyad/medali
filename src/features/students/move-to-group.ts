import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorGroupMemberChanges, mentorGroupMembers } from "@/db/schema";

async function groupOf(
  tx: Database,
  studentId: string,
): Promise<string | null> {
  const [member] = await tx
    .select({ groupId: mentorGroupMembers.groupId })
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.studentId, studentId));
  return member?.groupId ?? null;
}

/**
 * Puts a student in a group, or in none for null, and logs it as the
 * work of the account `by`: joining, moving, going back to none. A
 * student who stays where they are is left alone and nothing is logged.
 * The group must have been checked and held first.
 */
export async function moveToGroup(
  tx: Database,
  studentId: string,
  groupId: string | null,
  by: string,
): Promise<void> {
  const before = await groupOf(tx, studentId);
  if (before === groupId) return;
  if (before !== null) {
    await tx
      .delete(mentorGroupMembers)
      .where(eq(mentorGroupMembers.studentId, studentId));
  }
  if (groupId !== null) {
    await tx.insert(mentorGroupMembers).values({ studentId, groupId });
  }
  await tx.insert(mentorGroupMemberChanges).values({
    studentId,
    groupBefore: before,
    groupAfter: groupId,
    changedBy: by,
  });
}
