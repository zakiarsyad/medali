import type { Database } from "@/db/connect";
import { proofFileRemovals } from "@/db/schema";
import type { CountsByKind } from "./proof-kinds";

export interface RemovalLine {
  by: string;
  at: Date;
  keepDays: number;
  counts: CountsByKind;
}

/** Writes who removed old proof files, when, with which days set, and how many of each kind. */
export async function writeRemovalLine(
  db: Database,
  line: RemovalLine,
): Promise<void> {
  const { counts } = line;
  await db.insert(proofFileRemovals).values({
    removedBy: line.by,
    removedAt: line.at,
    keepDays: line.keepDays,
    attendancePhotos: counts.attendance_photo,
    sikuPhotos: counts.siku_photo,
    returnPhotos: counts.return_photo,
    activityClarificationFiles: counts.activity_clarification,
    dormClarificationFiles: counts.dorm_clarification,
    appealProofs: counts.appeal_proof,
  });
}
