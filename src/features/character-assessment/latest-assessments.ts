import { desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, characterAssessments } from "@/db/schema";
import type { AssessmentSource } from "./assessment-ids";
import type { Scores } from "./assessment-score";

type StoredScores = Pick<
  typeof characterAssessments.$inferSelect,
  "scoreM" | "scoreE" | "scoreD" | "scoreA" | "scoreL" | "scoreI"
>;

/** The scores of a stored assessment, by MEDALI value. */
export function scoresOf(row: StoredScores): Scores {
  return {
    M: row.scoreM,
    E: row.scoreE,
    D: row.scoreD,
    A: row.scoreA,
    L: row.scoreL,
    I: row.scoreI,
  };
}

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
    })
    .from(characterAssessments)
    .orderBy(
      characterAssessments.studentId,
      desc(characterAssessments.enteredAt),
      desc(characterAssessments.id),
    )
    .as("latest_assessments");
}

/** A student's latest assessment, as the screens show it. */
export interface LatestAssessment {
  enteredAt: Date;
  source: AssessmentSource;
  /** The name of the account that entered it. */
  enteredBy: string;
  scores: Scores;
}

/** The latest assessment of each of some students that has one. */
export async function readLatestOf(
  db: Database,
  studentIds: string[],
): Promise<Map<string, LatestAssessment>> {
  const found = new Map<string, LatestAssessment>();
  if (studentIds.length === 0) return found;
  const latest = latestAssessments(db);
  const rows = await db
    .select({
      studentId: latest.studentId,
      enteredAt: latest.enteredAt,
      source: latest.source,
      enteredBy: accounts.name,
      scoreM: latest.scoreM,
      scoreE: latest.scoreE,
      scoreD: latest.scoreD,
      scoreA: latest.scoreA,
      scoreL: latest.scoreL,
      scoreI: latest.scoreI,
    })
    .from(latest)
    .innerJoin(accounts, eq(accounts.id, latest.enteredBy))
    .where(inArray(latest.studentId, studentIds));
  for (const row of rows) {
    const { studentId, enteredAt, source, enteredBy } = row;
    found.set(studentId, {
      enteredAt,
      source,
      enteredBy,
      scores: scoresOf(row),
    });
  }
  return found;
}
