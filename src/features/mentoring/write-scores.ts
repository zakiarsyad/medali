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

/** A score as it is given: the final score, the six indicator scores and their names. */
export interface GivenScore {
  score: number;
  indicatorScores: number[];
  indicatorNames: string[];
}

/** What a new score is of: the student and the period, with the score given. */
export interface NewScore extends GivenScore {
  studentId: string;
  periodId: string;
}

/**
 * Keeps the first score of a student in a period, and the first line of
 * its log, which has nothing before.
 */
export async function addScore(
  tx: Database,
  actorId: string,
  { studentId, periodId, ...given }: NewScore,
): Promise<void> {
  const [added] = await tx
    .insert(mentoringScores)
    .values({
      studentId,
      periodId,
      ...given,
      scoredBy: actorId,
      scoredAt: WRITTEN_NOW,
    })
    .returning({ id: mentoringScores.id });
  if (!added) throw new Error("The score was not added.");
  await tx.insert(mentoringScoreChanges).values({
    scoreId: added.id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    scoreAfter: given.score,
    indicatorScoresAfter: given.indicatorScores,
    indicatorNamesAfter: given.indicatorNames,
  });
}

/**
 * Puts a new score in the place of the one kept, and adds a line to the
 * log with the score, the indicator scores and their names before and
 * after.
 */
export async function changeScore(
  tx: Database,
  actorId: string,
  kept: KeptScore,
  given: GivenScore,
): Promise<void> {
  await tx
    .update(mentoringScores)
    .set({ ...given, scoredBy: actorId, scoredAt: WRITTEN_NOW })
    .where(eq(mentoringScores.id, kept.id));
  await tx.insert(mentoringScoreChanges).values({
    scoreId: kept.id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    scoreBefore: kept.score,
    indicatorScoresBefore: kept.indicatorScores,
    indicatorNamesBefore: kept.indicatorNames,
    scoreAfter: given.score,
    indicatorScoresAfter: given.indicatorScores,
    indicatorNamesAfter: given.indicatorNames,
  });
}
