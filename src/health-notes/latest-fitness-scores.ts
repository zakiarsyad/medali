import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { fitnessScores, fitnessTests } from "@/db/schema";

/**
 * Each student's latest fitness score, as a table to join students to:
 * the one saved last, so a correction wins even when its test day is
 * earlier. A student with none has no row here.
 */
export function latestFitnessScores(db: Database) {
  return db
    .selectDistinctOn([fitnessScores.studentId], {
      studentId: fitnessScores.studentId,
      score: fitnessScores.score,
      testedOn: fitnessTests.testedOn,
    })
    .from(fitnessScores)
    .innerJoin(fitnessTests, eq(fitnessTests.id, fitnessScores.testId))
    .orderBy(
      fitnessScores.studentId,
      desc(fitnessTests.enteredAt),
      desc(fitnessTests.id),
    )
    .as("latest_fitness_scores");
}
