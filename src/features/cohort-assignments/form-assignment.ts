import { eq, inArray } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import {
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  cohortAssignments,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { changeActionOf, STEP_ACTIONS, statusAfter } from "./assignment-steps";
import {
  type AssignmentRow,
  addLogLine,
  lockAssignment,
} from "./assignment-writes";
import { type FormedGroup, formGroups } from "./form-groups";
import type { Forming } from "./forming-input";
import { numberAfterLive, readHighestNumbers } from "./number-groups";
import { ALREADY_FIXED, DRAFT_CHANGED, NOT_ALLOWED } from "./refusals";
import { EVERY_ROW } from "./visible-assignments";
import { readWaitingStudents } from "./waiting-students";

const NOBODY_WAITS = {
  ok: false,
  error:
    "Angkatan ini tidak punya mahasiswa aktif yang belum masuk kelompok pengasuhan.",
} as const;

type Actor = Pick<Account, "id" | "roles">;

/** Starts the penetapan of an angkatan. Null when another one just did. */
async function startDraft(
  tx: Database,
  actorId: string,
  forming: Forming,
): Promise<string | null> {
  const [started] = await tx
    .insert(cohortAssignments)
    .values({
      cohortYear: forming.cohortYear,
      targetSize: forming.targetSize,
      method: forming.method,
      savedAt: WRITTEN_NOW,
      savedBy: actorId,
    })
    .onConflictDoNothing()
    .returning({ id: cohortAssignments.id });
  return started?.id ?? null;
}

/** Makes a stored penetapan a draft again, formed with what was asked now. */
async function restartDraft(
  tx: Database,
  actorId: string,
  stored: AssignmentRow,
  forming: Forming,
): Promise<string> {
  await tx
    .update(cohortAssignments)
    .set({
      status: "draft",
      targetSize: forming.targetSize,
      method: forming.method,
      version: stored.version + 1,
      savedAt: WRITTEN_NOW,
      savedBy: actorId,
    })
    .where(eq(cohortAssignments.id, stored.id));
  return stored.id;
}

async function removeGroups(tx: Database, assignmentId: string): Promise<void> {
  const ofAssignment = tx
    .select({ id: cohortAssignmentGroups.id })
    .from(cohortAssignmentGroups)
    .where(eq(cohortAssignmentGroups.assignmentId, assignmentId));
  await tx
    .delete(cohortAssignmentMembers)
    .where(inArray(cohortAssignmentMembers.groupId, ofAssignment));
  await tx
    .delete(cohortAssignmentGroups)
    .where(eq(cohortAssignmentGroups.assignmentId, assignmentId));
}

async function addGroup(
  tx: Database,
  assignmentId: string,
  group: FormedGroup,
): Promise<void> {
  const { studentIds, ...place } = group;
  const [added] = await tx
    .insert(cohortAssignmentGroups)
    .values({ assignmentId, ...place })
    .returning({ id: cohortAssignmentGroups.id });
  if (!added) throw new Error("The group was not added.");
  if (studentIds.length === 0) return;
  const members = studentIds.map((studentId) => ({
    studentId,
    groupId: added.id,
  }));
  await tx.insert(cohortAssignmentMembers).values(members);
}

/**
 * A waiting student who is still named by a group of another penetapan
 * could not be placed here: a student is in one such group at most. It
 * happens only to a student whose angkatan was changed after their old
 * angkatan was formed, and the old place is given up.
 */
async function freeFromOtherDrafts(
  tx: Database,
  studentIds: string[],
): Promise<void> {
  await tx
    .delete(cohortAssignmentMembers)
    .where(inArray(cohortAssignmentMembers.studentId, studentIds));
}

/**
 * "Bentuk kelompok" and "Bentuk ulang": forms the groups of an angkatan
 * from its students who wait for one, read here and never taken from the
 * browser, and saves them as the draft of the angkatan in place of what
 * it held. Adds a line to "Riwayat proses". Refused for a fixed angkatan,
 * and for a form that was shown with an older draft. Gives back how many
 * groups were formed.
 */
export async function formAssignment(
  db: Database,
  actor: Actor,
  forming: Forming,
): Promise<Parsed<number>> {
  if (!may(actor.roles, STEP_ACTIONS.form)) return NOT_ALLOWED;
  const { cohortYear } = forming;

  return db.transaction(async (tx) => {
    const stored = await lockAssignment(tx, cohortYear);
    const status = stored?.status ?? null;
    if (statusAfter(status, "form") === null) return ALREADY_FIXED;
    if ((stored?.version ?? 0) !== forming.version) return DRAFT_CHANGED;

    const waiting = await readWaitingStudents(tx, EVERY_ROW, cohortYear);
    if (waiting.length === 0) return NOBODY_WAITS;
    const formed = formGroups(waiting, forming.targetSize, forming.method);
    const highest = await readHighestNumbers(tx, cohortYear);
    const groups = numberAfterLive(formed, highest);

    const assignmentId = stored
      ? await restartDraft(tx, actor.id, stored, forming)
      : await startDraft(tx, actor.id, forming);
    if (assignmentId === null) return DRAFT_CHANGED;
    await removeGroups(tx, assignmentId);
    await freeFromOtherDrafts(
      tx,
      waiting.map((student) => student.id),
    );
    for (const group of groups) await addGroup(tx, assignmentId, group);
    await addLogLine(
      tx,
      assignmentId,
      actor.id,
      changeActionOf("form", status),
    );
    return { ok: true, value: groups.length };
  });
}
