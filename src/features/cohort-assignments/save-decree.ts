import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { cohortAssignments } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { readCompleteDraft } from "./complete-draft";
import type { Decree, DecreeInput } from "./decree-input";
import { type StepActor, takeStep } from "./take-step";

const SAVED = { ok: true, value: null } as const;

/** Writes "Nomor surat keputusan" and "Berlaku mulai" on a penetapan. */
export async function writeDecree(
  tx: Database,
  assignmentId: string,
  decree: Decree,
): Promise<void> {
  await tx
    .update(cohortAssignments)
    .set({
      decreeNumber: decree.decreeNumber,
      effectiveOn: decree.effectiveOn,
    })
    .where(eq(cohortAssignments.id, assignmentId));
}

/** "Simpan draf": saves the number and the day, and submits nothing. */
export function saveDecree(
  db: Database,
  actor: StepActor,
  input: DecreeInput,
): Promise<Parsed<null>> {
  return takeStep(db, actor, input, "save", async (tx, stored) => {
    await writeDecree(tx, stored.id, input);
    return SAVED;
  });
}

/**
 * "Ajukan ke Kepala UPK": saves the number and the day and makes the
 * draft Diajukan. A draft with a group without a mentor, or with one
 * mentor chosen twice, is refused and stays as it was.
 */
export function submitDraft(
  db: Database,
  actor: StepActor,
  input: DecreeInput,
): Promise<Parsed<null>> {
  return takeStep(db, actor, input, "submit", async (tx, stored) => {
    const draft = await readCompleteDraft(tx, stored.cohortYear);
    if (!draft.ok) return draft;
    await writeDecree(tx, stored.id, input);
    return SAVED;
  });
}
