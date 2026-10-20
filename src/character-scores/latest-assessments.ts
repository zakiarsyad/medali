import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { characterAssessments } from "@/db/schema";

/** Each student's assessments, the one saved last first. */
const NEWEST_FIRST = [
  characterAssessments.studentId,
  desc(characterAssessments.enteredAt),
  desc(characterAssessments.id),
];

/**
 * Each student's latest assessment, as a table to join students to: the
 * one saved last, whatever period it was made in. A student with none
 * has no row here. This latest one is the student's capaian karakter,
 * for any screen that shows it.
 */
export function latestAssessments(db: Database) {
  return db
    .selectDistinctOn([characterAssessments.studentId], {
      id: characterAssessments.id,
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
    .orderBy(...NEWEST_FIRST)
    .as("latest_assessments");
}

/**
 * Each student's assessment before their latest one, as a table to join
 * students to. A student with fewer than two has no row here.
 */
export function earlierAssessments(db: Database) {
  const latest = latestAssessments(db);
  const notLatest = and(
    eq(latest.studentId, characterAssessments.studentId),
    ne(latest.id, characterAssessments.id),
  );
  return db
    .selectDistinctOn([characterAssessments.studentId], {
      studentId: characterAssessments.studentId,
      scoreM: characterAssessments.scoreM,
      scoreE: characterAssessments.scoreE,
      scoreD: characterAssessments.scoreD,
      scoreA: characterAssessments.scoreA,
      scoreL: characterAssessments.scoreL,
      scoreI: characterAssessments.scoreI,
    })
    .from(characterAssessments)
    .innerJoin(latest, notLatest)
    .orderBy(...NEWEST_FIRST)
    .as("earlier_assessments");
}
