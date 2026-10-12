import { sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import { readCompleteDraft } from "./complete-draft";
import { type DecreeInput, wholeDecree } from "./decree-input";
import { whatStopsFix } from "./fix-check";
import {
  type GroupToStart,
  readLiveNumbers,
  startLiveGroups,
} from "./live-groups";
import { readMentorPool } from "./mentor-pool";
import { writeDecree } from "./save-decree";
import type { DraftGroup } from "./stored-assignment";
import { type StepActor, takeStep } from "./take-step";
import { EVERY_ROW } from "./visible-assignments";
import { readWaitingStudents } from "./waiting-students";

function groupToStart(group: DraftGroup): GroupToStart {
  if (group.mentor === null) {
    throw new Error("A complete draft holds a group without a mentor.");
  }
  return {
    id: group.id,
    studyProgramId: group.studyProgramId,
    entryPath: group.entryPath,
    number: group.number,
    mentorId: group.mentor.id,
    studentIds: group.members.map((member) => member.id),
  };
}

/**
 * Makes a penetapan wait until every other one that is being fixed has
 * ended. A fix holds only its own angkatan, so two angkatan fixed at the
 * same moment would each read the other's mentors as free, and one mentor
 * would get groups of both. The second now reads what the first saved.
 */
async function waitForOtherFixes(tx: Database): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('fix_cohort_assignment'))`,
  );
}

/** What stops the penetapan of these groups today, read at the server. */
async function readWhatStops(
  tx: Database,
  cohortYear: number,
  groups: GroupToStart[],
): Promise<string | null> {
  const [waiting, pool, liveNumbers] = await Promise.all([
    readWaitingStudents(tx, EVERY_ROW, cohortYear),
    readMentorPool(tx, cohortYear),
    readLiveNumbers(tx, cohortYear),
  ]);
  return whatStopsFix({
    groups,
    waitingIds: waiting.map((student) => student.id),
    offeredMentorIds: pool.map((mentor) => mentor.id),
    liveNumbers,
  });
}

/**
 * "Tetapkan": fixes the penetapan of an angkatan. Its groups become the
 * kelompok pengasuhan in force at once, each with its members and its
 * mentor from "Berlaku mulai", and the penetapan keeps the decree number
 * and that day. All of it is one transaction, so a penetapan is fixed
 * whole or not at all, and of two sent at once the second is refused.
 *
 * Refused without a decree number or a day, for a draft with a group
 * without a mentor or one mentor chosen twice, and when a member or a
 * mentor of the draft cannot be placed any more: see `whatStopsFix`.
 */
export function fixAssignment(
  db: Database,
  actor: StepActor,
  input: DecreeInput,
): Promise<Parsed<null>> {
  return takeStep(db, actor, input, "fix", async (tx, stored) => {
    const decree = wholeDecree(input);
    if (!decree.ok) return decree;
    const draft = await readCompleteDraft(tx, stored.cohortYear);
    if (!draft.ok) return draft;
    const groups = draft.value.groups.map(groupToStart);
    await waitForOtherFixes(tx);
    const stopped = await readWhatStops(tx, stored.cohortYear, groups);
    if (stopped !== null) return { ok: false, error: stopped };

    await writeDecree(tx, stored.id, decree.value);
    const { effectiveOn } = decree.value;
    await startLiveGroups(tx, groups, stored.cohortYear, effectiveOn);
    return { ok: true, value: null };
  });
}
