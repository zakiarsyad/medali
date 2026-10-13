import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorGroupMemberChanges, mentorGroupMembers } from "@/db/schema";

/**
 * The group a student is in, held until the save ends: a penetapan
 * cancelled at the same moment either waits, or has taken the student
 * out already, and then none is read here.
 */
async function heldGroupOf(
  tx: Database,
  studentId: string,
): Promise<string | null> {
  const [member] = await tx
    .select({ groupId: mentorGroupMembers.groupId })
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.studentId, studentId))
    .for("update");
  return member?.groupId ?? null;
}

/** False when the student was given a group by someone else meanwhile. */
async function joinGroup(
  tx: Database,
  studentId: string,
  groupId: string,
): Promise<boolean> {
  const joined = await tx
    .insert(mentorGroupMembers)
    .values({ studentId, groupId })
    .onConflictDoNothing({ target: mentorGroupMembers.studentId })
    .returning({ studentId: mentorGroupMembers.studentId });
  return joined.length === 1;
}

/**
 * Puts a student in a group, or in none for null, and logs it as the
 * work of the account `by`: joining, moving, going back to none. A
 * student who stays where they are is left alone and nothing is logged.
 * The group must have been checked and held first.
 *
 * Gives false, with nothing written, when a penetapan fixed at the same
 * moment gave the student a group first. Call it before the other writes
 * of a save that may meet one.
 */
export async function moveToGroup(
  tx: Database,
  studentId: string,
  groupId: string | null,
  by: string,
): Promise<boolean> {
  const before = await heldGroupOf(tx, studentId);
  if (before === groupId) return true;
  if (before !== null) {
    await tx
      .delete(mentorGroupMembers)
      .where(eq(mentorGroupMembers.studentId, studentId));
  }
  if (groupId !== null && !(await joinGroup(tx, studentId, groupId))) {
    return false;
  }
  await tx.insert(mentorGroupMemberChanges).values({
    studentId,
    groupBefore: before,
    groupAfter: groupId,
    changedBy: by,
  });
  return true;
}
