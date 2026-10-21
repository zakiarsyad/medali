import { count, eq, type SQL, type SQLWrapper, sql } from "drizzle-orm";
import {
  earlierAssessments,
  latestAssessments,
} from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { type Recap, recapOf, type ScoreGroup } from "./achievement-recap";
import { type CohortRecap, cohortRecaps } from "./cohort-recaps";

/** Capaian karakter of the students the Dashboard counts. */
export interface Achievement {
  /** Null while too few are assessed: then no number is given out. */
  recap: Recap | null;
  /** The rows of "Capaian MEDALI per angkatan" that may be shown. */
  cohorts: CohortRecap[];
}

function sumOf(score: SQLWrapper): SQL<number> {
  return sql<number>`coalesce(sum(${score}), 0)`.mapWith(Number);
}

/** Students without an assessment before their latest add nothing to it. */
function changeOf(latest: SQLWrapper, earlier: SQLWrapper): SQL<number> {
  return sumOf(sql`${latest} - ${earlier}`);
}

/**
 * The students grouped by angkatan, jalur and the total of their latest
 * scores, each group with the sums of those scores and of their change
 * since the assessment before. Only these few rows leave the database.
 */
async function readScoreGroups(
  db: Database,
  where: SQL,
): Promise<ScoreGroup[]> {
  const latest = latestAssessments(db);
  const earlier = earlierAssessments(db);
  return db
    .select({
      cohortYear: students.cohortYear,
      entryPath: students.entryPath,
      total: latest.total,
      students: count(),
      sums: {
        M: sumOf(latest.scoreM),
        E: sumOf(latest.scoreE),
        D: sumOf(latest.scoreD),
        A: sumOf(latest.scoreA),
        L: sumOf(latest.scoreL),
        I: sumOf(latest.scoreI),
      },
      withEarlier: count(earlier.studentId),
      changes: {
        M: changeOf(latest.scoreM, earlier.scoreM),
        E: changeOf(latest.scoreE, earlier.scoreE),
        D: changeOf(latest.scoreD, earlier.scoreD),
        A: changeOf(latest.scoreA, earlier.scoreA),
        L: changeOf(latest.scoreL, earlier.scoreL),
        I: changeOf(latest.scoreI, earlier.scoreI),
      },
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(earlier, eq(earlier.studentId, students.id))
    .where(where)
    .groupBy(students.cohortYear, students.entryPath, latest.total);
}

/**
 * Capaian karakter of the students `where` lets through. `filtered` tells
 * whether a filter is in use, which lets smaller cohorts be shown.
 */
export async function readAchievement(
  db: Database,
  where: SQL,
  filtered: boolean,
): Promise<Achievement> {
  const groups = await readScoreGroups(db, where);
  return {
    recap: recapOf(groups),
    cohorts: cohortRecaps(groups, filtered),
  };
}
