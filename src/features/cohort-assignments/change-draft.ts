import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { cohortAssignments } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { changeActionOf, STEP_ACTIONS, statusAfter } from "./assignment-steps";
import {
  type AssignmentRow,
  addLogLine,
  lockAssignment,
} from "./assignment-writes";
import type { DraftKey } from "./draft-change-input";
import {
  ALREADY_FIXED,
  DRAFT_CHANGED,
  NO_DRAFT,
  NOT_ALLOWED,
} from "./refusals";

export type DraftActor = Pick<Account, "id" | "roles">;

/**
 * What a change does to the groups of a draft. It checks what was sent
 * before it writes, so a refusal leaves the draft as it was.
 */
type Change<T> = (tx: Database, draft: AssignmentRow) => Promise<Parsed<T>>;

/**
 * Saves one change to the groups of a draft, and nothing when the change
 * is refused. Refused for a role that may not prepare a penetapan, for an
 * angkatan without groups or with fixed ones, and for a change made from
 * an older draft. A saved change raises the version of the draft, makes a
 * cancelled one a draft again and adds a line to "Riwayat proses".
 */
export async function changeDraft<T>(
  db: Database,
  actor: DraftActor,
  key: DraftKey,
  change: Change<T>,
): Promise<Parsed<T>> {
  if (!may(actor.roles, STEP_ACTIONS.save)) return NOT_ALLOWED;

  return db.transaction(async (tx) => {
    const draft = await lockAssignment(tx, key.cohortYear);
    if (draft === null) return NO_DRAFT;
    const status = statusAfter(draft.status, "save");
    if (status === null) return ALREADY_FIXED;
    if (draft.version !== key.version) return DRAFT_CHANGED;

    const changed = await change(tx, draft);
    if (!changed.ok) return changed;
    await tx
      .update(cohortAssignments)
      .set({
        status,
        version: draft.version + 1,
        savedAt: WRITTEN_NOW,
        savedBy: actor.id,
      })
      .where(eq(cohortAssignments.id, draft.id));
    await addLogLine(
      tx,
      draft.id,
      actor.id,
      changeActionOf("save", draft.status),
    );
    return changed;
  });
}
