import type { Database } from "@/db/connect";
import type { Parsed } from "@/parsed";
import { checkOfGroups, whatHoldsBack } from "./draft-check";
import { NO_DRAFT } from "./refusals";
import { readAssignment, type StoredAssignment } from "./stored-assignment";
import { EVERY_ROW } from "./visible-assignments";
import { readWaitingStudents } from "./waiting-students";

/**
 * The draft of an angkatan when it may be submitted and fixed, or what
 * holds it back: a group without a mentor or without a member, one mentor
 * chosen twice, a waiting student of the angkatan in no group, or a
 * member whose program studi or jalur is not that of their group any
 * more. The groups and the students are read here and never taken from
 * the browser, since a switched-off button protects nothing.
 */
export async function readCompleteDraft(
  tx: Database,
  cohortYear: number,
): Promise<Parsed<StoredAssignment>> {
  const [draft, waiting] = await Promise.all([
    readAssignment(tx, EVERY_ROW, cohortYear),
    readWaitingStudents(tx, EVERY_ROW, cohortYear),
  ]);
  if (draft === null) return NO_DRAFT;
  const heldBack = whatHoldsBack(checkOfGroups(draft.groups, waiting));
  if (heldBack !== null) return { ok: false, error: heldBack };
  return { ok: true, value: draft };
}
