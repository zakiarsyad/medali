import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { cohortAssignmentGroups } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { changeDraft, type DraftActor } from "./change-draft";
import type { DraftKey } from "./draft-change-input";
import { fillEmptyMentors } from "./fill-mentors";
import { readMentorPool } from "./mentor-pool";
import { NO_DRAFT } from "./refusals";
import { readAssignment } from "./stored-assignment";
import { EVERY_ROW } from "./visible-assignments";

const NOTHING_TO_FILL = {
  ok: false,
  error: "Semua kelompok sudah punya pengasuh.",
} as const;

const NOBODY_LEFT = {
  ok: false,
  error:
    "Tidak ada lagi pengasuh yang bisa dipilih untuk kelompok yang masih kosong.",
} as const;

/** The groups of a draft as filling reads them, in the order of the tab. */
async function readGroupsToFill(tx: Database, cohortYear: number) {
  const draft = await readAssignment(tx, EVERY_ROW, cohortYear);
  if (draft === null) return null;
  return draft.groups.map((group) => ({
    id: group.id,
    programName: group.programName,
    mentorId: group.mentor?.id ?? null,
  }));
}

/**
 * "Isi otomatis yang kosong": gives the groups of a draft that have no
 * mentor one each, as `fillEmptyMentors` picks them from the mentors that
 * may be chosen for the angkatan. Gives back how many groups it filled,
 * and saves nothing when it filled none.
 */
export function fillDraftMentors(
  db: Database,
  actor: DraftActor,
  key: DraftKey,
): Promise<Parsed<number>> {
  return changeDraft(db, actor, key, async (tx, draft) => {
    const groups = await readGroupsToFill(tx, draft.cohortYear);
    if (groups === null) return NO_DRAFT;
    const emptyIds = groups
      .filter((group) => group.mentorId === null)
      .map((group) => group.id);
    if (emptyIds.length === 0) return NOTHING_TO_FILL;

    const pool = await readMentorPool(tx, draft.cohortYear);
    const filled = fillEmptyMentors(groups, pool).filter(
      (group) => group.mentorId !== null && emptyIds.includes(group.id),
    );
    if (filled.length === 0) return NOBODY_LEFT;
    for (const { id, mentorId } of filled) {
      await tx
        .update(cohortAssignmentGroups)
        .set({ mentorId })
        .where(eq(cohortAssignmentGroups.id, id));
    }
    return { ok: true, value: filled.length };
  });
}
