import type { Database } from "@/db/connect";
import { waitForOtherMentorChanges } from "@/mentoring/mentor-change-lock";
import type { Parsed } from "@/parsed";
import { readCompleteDraft } from "./complete-draft";
import { type DecreeInput, wholeDecree } from "./decree-input";
import { whatStopsFix } from "./fix-check";
import { holdDraftStudents } from "./hold-draft-students";
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
 * It holds the record of each student of the draft before it reads who
 * still waits for a group, so a student given a group or removed on
 * Pengguna baru mahasiswa at the same moment is read as that save left
 * them.
 *
 * Refused without a decree number or a day, for a draft that is not
 * complete (see `readCompleteDraft`), and when a member or a mentor of
 * the draft cannot be placed any more: see `whatStopsFix`.
 */
export function fixAssignment(
  db: Database,
  actor: StepActor,
  input: DecreeInput,
): Promise<Parsed<null>> {
  return takeStep(db, actor, input, "fix", async (tx, stored) => {
    const decree = wholeDecree(input);
    if (!decree.ok) return decree;
    // Before the wait below, never while it is held: a student save may
    // wait for a group that a mentor replacement holds, and that
    // replacement would wait for a fix that waits for the student.
    await holdDraftStudents(tx, stored.id);
    // A fix holds only its own angkatan: without this, two fixed at the
    // same moment would each read the other's mentors as free.
    await waitForOtherMentorChanges(tx);
    const draft = await readCompleteDraft(tx, stored.cohortYear);
    if (!draft.ok) return draft;
    const groups = draft.value.groups.map(groupToStart);
    const stopped = await readWhatStops(tx, stored.cohortYear, groups);
    if (stopped !== null) return { ok: false, error: stopped };

    await writeDecree(tx, stored.id, decree.value);
    const { effectiveOn } = decree.value;
    await startLiveGroups(tx, groups, stored.cohortYear, effectiveOn);
    return { ok: true, value: null };
  });
}
