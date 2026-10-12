import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { cohortAssignmentGroups } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { changeDraft, type DraftActor } from "./change-draft";
import type { MentorChoiceInput } from "./draft-change-input";
import { readMentorPool } from "./mentor-pool";
import { GROUP_NOT_IN_DRAFT } from "./refusals";

const MENTOR_NOT_OFFERED = {
  ok: false,
  error:
    "Pengasuh ini tidak bisa dipilih untuk angkatan ini. Pilih pengasuh lain dari daftar.",
} as const;

async function isOffered(
  tx: Database,
  cohortYear: number,
  mentorId: string,
): Promise<boolean> {
  const pool = await readMentorPool(tx, cohortYear);
  return pool.some((mentor) => mentor.id === mentorId);
}

/**
 * Saves the mentor chosen for one group of a draft, or takes the mentor
 * off it. The mentor must be one that may be chosen for the angkatan,
 * read here and never taken from the browser, and the group one of the
 * draft. One mentor may be saved for two groups: the note says so, and
 * the penetapan waits until it is put right.
 */
export function chooseMentor(
  db: Database,
  actor: DraftActor,
  choice: MentorChoiceInput,
): Promise<Parsed<null>> {
  const { groupId, mentorId } = choice;
  return changeDraft(db, actor, choice, async (tx, draft) => {
    const isRefused =
      mentorId !== null && !(await isOffered(tx, draft.cohortYear, mentorId));
    if (isRefused) return MENTOR_NOT_OFFERED;
    const changed = await tx
      .update(cohortAssignmentGroups)
      .set({ mentorId })
      .where(
        and(
          eq(cohortAssignmentGroups.id, groupId),
          eq(cohortAssignmentGroups.assignmentId, draft.id),
        ),
      )
      .returning({ id: cohortAssignmentGroups.id });
    if (changed.length === 0) return GROUP_NOT_IN_DRAFT;
    return { ok: true, value: null };
  });
}
