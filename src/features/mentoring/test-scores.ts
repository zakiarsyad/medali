import { asc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentoringScoreChanges, mentoringScores } from "@/db/schema";

/**
 * Made-up records for the checks of mentoring scores.
 */

type TestScore = Pick<
  typeof mentoringScores.$inferInsert,
  "studentId" | "periodId" | "score" | "scoredBy"
> &
  Partial<typeof mentoringScores.$inferInsert>;

/** A stored score, without a log line. */
export async function addTestScore(
  db: Database,
  score: TestScore,
): Promise<string> {
  const [added] = await db
    .insert(mentoringScores)
    .values({ scoredAt: new Date(), ...score })
    .returning({ id: mentoringScores.id });
  if (!added) throw new Error("The score was not added.");
  return added.id;
}

/** The scores kept for a student, in every period. */
export function testScoresOf(db: Database, studentId: string) {
  return db
    .select()
    .from(mentoringScores)
    .where(eq(mentoringScores.studentId, studentId));
}

/** The log lines of the scores of a student, the oldest first. */
export async function testScoreLogOf(db: Database, studentId: string) {
  const lines = await db
    .select({ line: mentoringScoreChanges })
    .from(mentoringScoreChanges)
    .innerJoin(
      mentoringScores,
      eq(mentoringScores.id, mentoringScoreChanges.scoreId),
    )
    .where(eq(mentoringScores.studentId, studentId))
    .orderBy(asc(mentoringScoreChanges.changedAt));
  return lines.map(({ line }) => line);
}
