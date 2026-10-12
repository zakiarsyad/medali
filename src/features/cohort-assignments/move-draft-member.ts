import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { cohortAssignmentMembers } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { changeDraft, type DraftActor } from "./change-draft";
import type { MoveInput } from "./draft-change-input";
import { type GroupWithMembers, moveMember } from "./move-member";
import { readAssignment } from "./stored-assignment";
import { EVERY_ROW } from "./visible-assignments";

const MOVE_REFUSED = {
  ok: false,
  error:
    "Mahasiswa hanya bisa dipindahkan ke kelompok lain dari program studi dan jalur yang sama pada draf ini.",
} as const;

async function readGroupsWithMembers(
  tx: Database,
  cohortYear: number,
): Promise<GroupWithMembers[]> {
  const draft = await readAssignment(tx, EVERY_ROW, cohortYear);
  if (draft === null) return [];
  return draft.groups.map((group) => ({
    id: group.id,
    studyProgramId: group.studyProgramId,
    entryPath: group.entryPath,
    studentIds: group.members.map((member) => member.id),
  }));
}

/**
 * Moves a student of a draft to another of its groups. The groups and
 * their members are read here and never taken from the browser: the
 * student must be in a group of the draft, and the other group one of
 * the draft, of the same program studi and jalur.
 */
export function moveDraftMember(
  db: Database,
  actor: DraftActor,
  move: MoveInput,
): Promise<Parsed<null>> {
  const { studentId, toGroupId } = move;
  return changeDraft(db, actor, move, async (tx, draft) => {
    const groups = await readGroupsWithMembers(tx, draft.cohortYear);
    if (moveMember(groups, studentId, toGroupId) === null) return MOVE_REFUSED;
    await tx
      .update(cohortAssignmentMembers)
      .set({ groupId: toGroupId })
      .where(eq(cohortAssignmentMembers.studentId, studentId));
    return { ok: true, value: null };
  });
}
