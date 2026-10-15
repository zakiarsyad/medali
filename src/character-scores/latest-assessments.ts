import { desc, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { characterAssessments } from "@/db/schema";

/**
 * Each student's latest assessment, as a table to join students to: the
 * one saved last, whatever period it was made in. A student with none
 * has no row here. This latest one is the student's capaian karakter,
 * for any screen that shows it.
 */
export function latestAssessments(db: Database) {
  return db
    .selectDistinctOn([characterAssessments.studentId], {
      studentId: characterAssessments.studentId,
      scoreM: characterAssessments.scoreM,
      scoreE: characterAssessments.scoreE,
      scoreD: characterAssessments.scoreD,
      scoreA: characterAssessments.scoreA,
      scoreL: characterAssessments.scoreL,
      scoreI: characterAssessments.scoreI,
      total:
        sql<number>`(${characterAssessments.scoreM} + ${characterAssessments.scoreE} + ${characterAssessments.scoreD} + ${characterAssessments.scoreA} + ${characterAssessments.scoreL} + ${characterAssessments.scoreI})`
          .mapWith(Number)
          .as("total"),
      source: characterAssessments.source,
      periodId: characterAssessments.periodId,
      enteredBy: characterAssessments.enteredBy,
      enteredAt: characterAssessments.enteredAt,
      uploadId: characterAssessments.uploadId,
    })
    .from(characterAssessments)
    .orderBy(
      characterAssessments.studentId,
      desc(characterAssessments.enteredAt),
      desc(characterAssessments.id),
    )
    .as("latest_assessments");
}
