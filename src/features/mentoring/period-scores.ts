import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentoringScores } from "@/db/schema";

/**
 * The mentoring score kept for each of some students in a period, by the
 * key of the student. A student without one has no entry.
 */
export async function readPeriodScores(
  db: Database,
  studentIds: readonly string[],
  periodId: string,
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (studentIds.length === 0) return scores;
  const rows = await db
    .select({
      studentId: mentoringScores.studentId,
      score: mentoringScores.score,
    })
    .from(mentoringScores)
    .where(
      and(
        eq(mentoringScores.periodId, periodId),
        inArray(mentoringScores.studentId, [...studentIds]),
      ),
    );
  for (const { studentId, score } of rows) scores.set(studentId, score);
  return scores;
}
