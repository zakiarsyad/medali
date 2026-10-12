import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  mentorGroupMembers,
  mentorGroupPastMembers,
  mentorGroups,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import type { DraftKey } from "./draft-change-input";
import { type StepActor, takeStep } from "./take-step";

/** The kelompok pengasuhan that the groups of a penetapan became. */
async function readLiveIds(
  tx: Database,
  assignmentId: string,
): Promise<string[]> {
  const groups = await tx
    .select({ liveId: cohortAssignmentGroups.mentorGroupId })
    .from(cohortAssignmentGroups)
    .where(eq(cohortAssignmentGroups.assignmentId, assignmentId));
  const liveIds: string[] = [];
  for (const group of groups) {
    if (group.liveId !== null) liveIds.push(group.liveId);
  }
  return liveIds;
}

/**
 * Takes the members out of the groups and keeps who they were, so each
 * student is free for a new group and no mentor reads them any more.
 */
async function moveMembersToPast(
  tx: Database,
  liveIds: string[],
): Promise<void> {
  const members = await tx
    .delete(mentorGroupMembers)
    .where(inArray(mentorGroupMembers.groupId, liveIds))
    .returning();
  if (members.length === 0) return;
  await tx.insert(mentorGroupPastMembers).values(members);
}

/**
 * Ends the kelompok pengasuhan of a penetapan, with who and when. Nothing
 * is erased: the groups stay stored with their mentor lines, and so does
 * everything recorded for their students. The groups of the draft name no
 * kelompok any more.
 */
async function endLiveGroups(
  tx: Database,
  assignmentId: string,
  endedBy: string,
): Promise<void> {
  const liveIds = await readLiveIds(tx, assignmentId);
  if (liveIds.length === 0) return;
  await tx
    .update(mentorGroups)
    .set({ endedAt: WRITTEN_NOW, endedBy })
    .where(inArray(mentorGroups.id, liveIds));
  await moveMembersToPast(tx, liveIds);
  await tx
    .update(cohortAssignmentGroups)
    .set({ mentorGroupId: null })
    .where(eq(cohortAssignmentGroups.assignmentId, assignmentId));
}

/**
 * "Batalkan penetapan": cancels the fixed penetapan of an angkatan, at any
 * time. Its groups in force are ended and its students go back to having
 * no group, in one transaction. The groups and the mentors chosen stay as
 * they were saved, to be changed, submitted and fixed again. Refused for
 * any role but one that may fix, for an angkatan that is not fixed, and
 * for a cancel sent from an older version.
 */
export function cancelAssignment(
  db: Database,
  actor: StepActor,
  key: DraftKey,
): Promise<Parsed<null>> {
  return takeStep(db, actor, key, "cancel", async (tx, stored) => {
    await endLiveGroups(tx, stored.id, actor.id);
    return { ok: true, value: null };
  });
}
