import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { cohortAssignments } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  type AssignmentStep,
  changeActionOf,
  STEP_ACTIONS,
  statusAfter,
} from "./assignment-steps";
import {
  type AssignmentRow,
  addLogLine,
  lockAssignment,
} from "./assignment-writes";
import type { DraftKey } from "./draft-change-input";
import { dropLeftMembers } from "./dropped-members";
import {
  ALREADY_FIXED,
  DRAFT_CHANGED,
  NO_DRAFT,
  NOT_ALLOWED,
  NOT_ALLOWED_TO_FIX,
  NOT_FIXED,
} from "./refusals";

export type StepActor = Pick<Account, "id" | "roles">;

/** A step taken on a penetapan that is stored already. */
export type StoredStep = Exclude<AssignmentStep, "form">;

/**
 * What a step does to a penetapan beyond its status. It checks everything
 * before it writes: a refusal ends the step with what was written kept,
 * so a refusal must come before the first write.
 */
export type StepWork<T> = (
  tx: Database,
  stored: AssignmentRow,
) => Promise<Parsed<T>>;

function isFixing(step: StoredStep): boolean {
  return step === "fix" || step === "cancel";
}

/**
 * Takes one step on the penetapan of an angkatan, in one transaction that
 * holds the penetapan, so two steps never run at the same moment. Refused
 * for a role without the right to the step, for an angkatan without
 * groups, for a step that cannot be taken from where the penetapan
 * stands, and for one sent from an older version of it. A step that is
 * taken raises the version, moves the status and adds a line to "Riwayat
 * proses". It also takes out of the stored groups the students who have
 * left the draft, which the step itself no longer read.
 */
export async function takeStep<T>(
  db: Database,
  actor: StepActor,
  key: DraftKey,
  step: StoredStep,
  work: StepWork<T>,
): Promise<Parsed<T>> {
  if (!may(actor.roles, STEP_ACTIONS[step])) {
    return isFixing(step) ? NOT_ALLOWED_TO_FIX : NOT_ALLOWED;
  }

  return db.transaction(async (tx) => {
    const stored = await lockAssignment(tx, key.cohortYear);
    if (stored === null) return NO_DRAFT;
    const status = statusAfter(stored.status, step);
    if (status === null) return step === "cancel" ? NOT_FIXED : ALREADY_FIXED;
    if (stored.version !== key.version) return DRAFT_CHANGED;

    const done = await work(tx, stored);
    if (!done.ok) return done;
    await dropLeftMembers(tx, stored.id, actor.id);
    await tx
      .update(cohortAssignments)
      .set({
        status,
        version: stored.version + 1,
        savedAt: WRITTEN_NOW,
        savedBy: actor.id,
      })
      .where(eq(cohortAssignments.id, stored.id));
    await addLogLine(
      tx,
      stored.id,
      actor.id,
      changeActionOf(step, stored.status),
    );
    return done;
  });
}
