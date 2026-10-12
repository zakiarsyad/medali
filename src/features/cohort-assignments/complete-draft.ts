import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import { checkOfGroups, whatHoldsBack } from "./draft-check";
import { NO_DRAFT } from "./refusals";
import { readAssignment, type StoredAssignment } from "./stored-assignment";
import { EVERY_ROW } from "./visible-assignments";

/**
 * The draft of an angkatan when it may be submitted and fixed, or what
 * holds it back: a group without a mentor, or one mentor chosen twice.
 * The groups are read here and never taken from the browser, since a
 * switched-off button protects nothing.
 */
export async function readCompleteDraft(
  tx: Database,
  cohortYear: number,
): Promise<Parsed<StoredAssignment>> {
  const draft = await readAssignment(tx, EVERY_ROW, cohortYear);
  if (draft === null) return NO_DRAFT;
  const heldBack = whatHoldsBack(checkOfGroups(draft.groups));
  if (heldBack !== null) return { ok: false, error: heldBack };
  return { ok: true, value: draft };
}
