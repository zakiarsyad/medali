import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentoringScoreChanges, mentoringScores } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";

export type KeptScore = typeof mentoringScores.$inferSelect;

/** The score kept for each of these students in a period, by the id of the student. */
export async function readKeptScores(
  tx: Database,
  periodId: string,
  studentIds: string[],
): Promise<Map<string, KeptScore>> {
  if (studentIds.length === 0) return new Map();
  const rows = await tx
    .select()
    .from(mentoringScores)
    .where(
      and(
        eq(mentoringScores.periodId, periodId),
        inArray(mentoringScores.studentId, studentIds),
      ),
    );
  return new Map(rows.map((row) => [row.studentId, row]));
}

/** What a new score is of: the student, the period and who gives it. */
export interface NewScore {
  studentId: string;
  periodId: string;
  score: number;
}

/**
 * Keeps the first score of a student in a period, and the first line of
 * its log, which has nothing before.
 */
export async function addScore(
  tx: Database,
  actorId: string,
  { studentId, periodId, score }: NewScore,
): Promise<void> {
  const [added] = await tx
    .insert(mentoringScores)
    .values({
      studentId,
      periodId,
      score,
      scoredBy: actorId,
      scoredAt: WRITTEN_NOW,
    })
    .returning({ id: mentoringScores.id });
  if (!added) throw new Error("The score was not added.");
  await tx.insert(mentoringScoreChanges).values({
    scoreId: added.id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    scoreAfter: score,
  });
}

/**
 * Puts a new score in the place of the one kept, and adds a line to the
 * log with the score before and after.
 */
export async function changeScore(
  tx: Database,
  actorId: string,
  kept: KeptScore,
  score: number,
): Promise<void> {
  await tx
    .update(mentoringScores)
    .set({ score, scoredBy: actorId, scoredAt: WRITTEN_NOW })
    .where(eq(mentoringScores.id, kept.id));
  await tx.insert(mentoringScoreChanges).values({
    scoreId: kept.id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    scoreBefore: kept.score,
    scoreAfter: score,
  });
}
