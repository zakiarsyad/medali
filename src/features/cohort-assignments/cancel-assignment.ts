import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  mentorGroupMembers,
  mentorGroupPastMembers,
  mentorGroups,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import { cancelWaitingReplacementsOf } from "@/mentoring/cancel-waiting-replacements";
import type { Parsed } from "@/parsed";
import type { DraftKey } from "./draft-change-input";
import { type StepActor, takeStep } from "./take-step";

type LiveMember = typeof mentorGroupMembers.$inferSelect;

/**
 * The kelompok pengasuhan that the groups of a penetapan became, each
 * with the id of the group of the draft it came from.
 */
async function readDraftIdsByLiveId(
  tx: Database,
  assignmentId: string,
): Promise<Map<string, string>> {
  const groups = await tx
    .select({
      id: cohortAssignmentGroups.id,
      liveId: cohortAssignmentGroups.mentorGroupId,
    })
    .from(cohortAssignmentGroups)
    .where(eq(cohortAssignmentGroups.assignmentId, assignmentId));
  const draftIdOf = new Map<string, string>();
  for (const group of groups) {
    if (group.liveId !== null) draftIdOf.set(group.liveId, group.id);
  }
  return draftIdOf;
}

/**
 * Takes the members out of the groups and keeps who they were, so each
 * student is free for a new group and no mentor reads them any more.
 * Gives back who they were.
 */
async function moveMembersToPast(
  tx: Database,
  liveIds: string[],
): Promise<LiveMember[]> {
  const members = await tx
    .delete(mentorGroupMembers)
    .where(inArray(mentorGroupMembers.groupId, liveIds))
    .returning();
  if (members.length > 0) {
    await tx.insert(mentorGroupPastMembers).values(members);
  }
  return members;
}

/**
 * Makes the draft hold, for each of its groups, the members its kelompok
 * had when it was ended, in place of those prepared before the
 * penetapan: a student placed, moved or taken out on Pengguna baru
 * mahasiswa since then stays where they were. A member whom the draft of
 * another angkatan still names gives that place up: a student is in one
 * such group at most.
 */
async function keepMembersInDraft(
  tx: Database,
  draftIdOf: Map<string, string>,
  members: LiveMember[],
): Promise<void> {
  await tx
    .delete(cohortAssignmentMembers)
    .where(inArray(cohortAssignmentMembers.groupId, [...draftIdOf.values()]));
  if (members.length === 0) return;
  const kept = members.map(({ studentId, groupId }) => {
    const draftId = draftIdOf.get(groupId);
    if (draftId === undefined) {
      throw new Error("A member was taken out of a group not ended here.");
    }
    return { studentId, groupId: draftId };
  });
  await tx.delete(cohortAssignmentMembers).where(
    inArray(
      cohortAssignmentMembers.studentId,
      kept.map((member) => member.studentId),
    ),
  );
  await tx.insert(cohortAssignmentMembers).values(kept);
}

/**
 * Ends the kelompok pengasuhan of a penetapan, with who and when. Nothing
 * is erased: the groups stay stored with their mentor lines, and so does
 * everything recorded for their students. A replacement of their mentor
 * that still waited for its start date is cancelled with them. The groups
 * of the draft get the members their kelompok had, and name no kelompok
 * any more.
 */
async function endLiveGroups(
  tx: Database,
  assignmentId: string,
  endedBy: string,
): Promise<void> {
  const draftIdOf = await readDraftIdsByLiveId(tx, assignmentId);
  const liveIds = [...draftIdOf.keys()];
  if (liveIds.length === 0) return;
  // Before the members are read: a save on Pengguna baru mahasiswa holds
  // the group it puts a student into, so this waits for it, and the
  // members taken out below are those of the moment the groups end.
  await tx
    .update(mentorGroups)
    .set({ endedAt: WRITTEN_NOW, endedBy })
    .where(inArray(mentorGroups.id, liveIds));
  await cancelWaitingReplacementsOf(tx, liveIds, endedBy);
  const members = await moveMembersToPast(tx, liveIds);
  await keepMembersInDraft(tx, draftIdOf, members);
  await tx
    .update(cohortAssignmentGroups)
    .set({ mentorGroupId: null })
    .where(eq(cohortAssignmentGroups.assignmentId, assignmentId));
}

/**
 * "Batalkan penetapan": cancels the fixed penetapan of an angkatan, at any
 * time. Its groups in force are ended and its students go back to having
 * no group, in one transaction. The groups stay as a draft, with the
 * mentors chosen and the members each group had at that moment, to be
 * changed, submitted and fixed again. Refused for
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
