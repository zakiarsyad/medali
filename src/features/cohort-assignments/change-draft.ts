import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import type { DraftKey } from "./draft-change-input";
import { type StepActor, type StepWork, takeStep } from "./take-step";

export type DraftActor = StepActor;

/**
 * Saves one change to a draft, and nothing when the change is refused.
 * Refused for a role that may not prepare a penetapan, for an angkatan
 * without groups or with fixed ones, and for a change made from an older
 * draft. A saved change raises the version of the draft, makes a
 * cancelled one a draft again and adds a line to "Riwayat proses".
 */
export function changeDraft<T>(
  db: Database,
  actor: DraftActor,
  key: DraftKey,
  change: StepWork<T>,
): Promise<Parsed<T>> {
  return takeStep(db, actor, key, "save", change);
}
