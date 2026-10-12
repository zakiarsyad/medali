import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { cohortAssignmentChanges, cohortAssignments } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { ChangeAction } from "./assignment-steps";

export type AssignmentRow = typeof cohortAssignments.$inferSelect;

/**
 * Reads the penetapan of an angkatan and holds it until the transaction
 * ends. Every change to a penetapan starts here, so two of them for one
 * angkatan never run at the same moment: the second waits, and then sees
 * the version the first one saved.
 */
export async function lockAssignment(
  tx: Database,
  cohortYear: number,
): Promise<AssignmentRow | null> {
  const [assignment] = await tx
    .select()
    .from(cohortAssignments)
    .where(eq(cohortAssignments.cohortYear, cohortYear))
    .for("update");
  return assignment ?? null;
}

/** Adds to "Riwayat proses" who did what, at the moment it is written. */
export async function addLogLine(
  tx: Database,
  assignmentId: string,
  changedBy: string,
  action: ChangeAction,
): Promise<void> {
  await tx.insert(cohortAssignmentChanges).values({
    assignmentId,
    changedBy,
    changedAt: WRITTEN_NOW,
    action,
  });
}
