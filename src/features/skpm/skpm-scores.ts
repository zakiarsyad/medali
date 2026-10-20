import { inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { skpmScoreOf } from "./skpm-score";
import { countUploadsInForce, totalsByStudent } from "./skpm-totals";

/** Nilai SKPM of some students, with how many uploads count now. */
export interface SkpmScores {
  uploads: number;
  /** By the key of the student; one with no row in force has no entry. */
  scores: Map<string, number>;
}

/** Nilai SKPM of each of some students by the uploads in force. */
export async function readSkpmScores(
  db: Database,
  studentIds: readonly string[],
  pointsForHundred: number,
): Promise<SkpmScores> {
  const scores = new Map<string, number>();
  const uploads = await countUploadsInForce(db);
  if (uploads === 0 || studentIds.length === 0) return { uploads, scores };
  const totals = totalsByStudent(db);
  const rows = await db
    .select({ studentId: totals.studentId, total: totals.total })
    .from(totals)
    .where(inArray(totals.studentId, [...studentIds]));
  for (const { studentId, total } of rows) {
    scores.set(studentId, skpmScoreOf(total, pointsForHundred));
  }
  return { uploads, scores };
}
