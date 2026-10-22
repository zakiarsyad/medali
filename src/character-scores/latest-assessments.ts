import { and, desc, eq, ne, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { characterAssessments } from "@/db/schema";
import {
  isLimitedSql,
  limitedScoreSql,
  limitedStudents,
} from "@/discipline-penalties/limit-sql";
import type { Scores } from "./assessment-score";

/** Each student's assessments, the one saved last first. */
const NEWEST_FIRST = [
  characterAssessments.studentId,
  desc(characterAssessments.enteredAt),
  desc(characterAssessments.id),
];

const { scoreM, scoreE, scoreD, scoreA, scoreL, scoreI } = characterAssessments;

/**
 * The six scores of an assessment as every screen shows them: at most 70
 * when `limited`, for a student under a Ringan or Sedang penalty,
 * whenever the score was saved. The stored scores are never changed.
 * A read names a worked-out field without its table, so each table gives
 * its scores names of their own: a read that joins the latest and the
 * earlier assessment would find two of each otherwise.
 */
function shownScores(limited: SQL<boolean>, table: string) {
  return {
    scoreM: limitedScoreSql(scoreM, limited).as(`${table}_score_m`),
    scoreE: limitedScoreSql(scoreE, limited).as(`${table}_score_e`),
    scoreD: limitedScoreSql(scoreD, limited).as(`${table}_score_d`),
    scoreA: limitedScoreSql(scoreA, limited).as(`${table}_score_a`),
    scoreL: limitedScoreSql(scoreL, limited).as(`${table}_score_l`),
    scoreI: limitedScoreSql(scoreI, limited).as(`${table}_score_i`),
  };
}

/** The total of the six scores, each as it counts. */
function shownTotal(limited: SQL<boolean>) {
  const scores = [scoreM, scoreE, scoreD, scoreA, scoreL, scoreI].map((score) =>
    limitedScoreSql(score, limited),
  );
  return sql<number>`(${sql.join(scores, sql` + `)})`
    .mapWith(Number)
    .as("total");
}

/**
 * Each student's latest assessment, as a table to join students to: the
 * one saved last, whatever period it was made in. A student with none
 * has no row here. This latest one is the student's capaian karakter,
 * for any screen that shows it. Its scores and their total are held at
 * 70 under a Ringan or Sedang penalty; the total as stored is kept
 * beside them, for "Rerata sebelum pembatasan".
 */
export function latestAssessments(db: Database) {
  const limitedOnes = limitedStudents(db);
  const limited = isLimitedSql(limitedOnes);
  return db
    .selectDistinctOn([characterAssessments.studentId], {
      id: characterAssessments.id,
      studentId: characterAssessments.studentId,
      ...shownScores(limited, "latest"),
      total: shownTotal(limited),
      storedTotal:
        sql<number>`(${scoreM} + ${scoreE} + ${scoreD} + ${scoreA} + ${scoreL} + ${scoreI})`
          .mapWith(Number)
          .as("latest_stored_total"),
      limited: sql<boolean>`${limited}`.as("latest_limited"),
      source: characterAssessments.source,
      periodId: characterAssessments.periodId,
      enteredBy: characterAssessments.enteredBy,
      enteredAt: characterAssessments.enteredAt,
      uploadId: characterAssessments.uploadId,
    })
    .from(characterAssessments)
    .leftJoin(
      limitedOnes,
      eq(limitedOnes.studentId, characterAssessments.studentId),
    )
    .orderBy(...NEWEST_FIRST)
    .as("latest_assessments");
}

/**
 * Each student's assessment before their latest one, as a table to join
 * students to, its scores held at 70 as the latest one's are. A student
 * with fewer than two has no row here.
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
      ...shownScores(sql<boolean>`${latest.limited}`, "earlier"),
    })
    .from(characterAssessments)
    .innerJoin(latest, notLatest)
    .orderBy(...NEWEST_FIRST)
    .as("earlier_assessments");
}

/**
 * The scores of a student's latest assessment as stored, before any
 * limit, or null for a student never assessed: for a screen that shows
 * what a limit would change. Who may read them is decided by the caller.
 */
export async function readStoredLatestOf(
  db: Database,
  studentId: string,
): Promise<Scores | null> {
  const [found] = await db
    .select({
      M: scoreM,
      E: scoreE,
      D: scoreD,
      A: scoreA,
      L: scoreL,
      I: scoreI,
    })
    .from(characterAssessments)
    .where(eq(characterAssessments.studentId, studentId))
    .orderBy(...NEWEST_FIRST)
    .limit(1);
  return found ?? null;
}
