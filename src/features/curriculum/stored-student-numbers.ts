import { and, count, eq, type SQL, sum } from "drizzle-orm";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { CohortCount } from "./student-numbers";
import type { ScoreGroup } from "./tahap-scores";

/**
 * How many active students each angkatan has, of every program. It holds
 * no names, so it is the same for everyone who opens the page; only a
 * row for each angkatan leaves the database.
 */
export async function readCohortCounts(db: Database): Promise<CohortCount[]> {
  return db
    .select({ cohortYear: students.cohortYear, students: count() })
    .from(students)
    .where(ACTIVE_MEMBER)
    .groupBy(students.cohortYear);
}

/**
 * The latest scores of the assessed active students `visible` lets
 * through, added up by angkatan and by the total of the six scores. A
 * student with no assessment is left out. Only those sums leave the
 * database, never a student's own scores.
 */
export async function readScoreGroups(
  db: Database,
  visible: SQL,
): Promise<ScoreGroup[]> {
  const latest = latestAssessments(db);
  const rows = await db
    .select({
      cohortYear: students.cohortYear,
      total: latest.total,
      students: count(),
      M: sum(latest.scoreM).mapWith(Number),
      E: sum(latest.scoreE).mapWith(Number),
      D: sum(latest.scoreD).mapWith(Number),
      A: sum(latest.scoreA).mapWith(Number),
      L: sum(latest.scoreL).mapWith(Number),
      I: sum(latest.scoreI).mapWith(Number),
    })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(and(visible, ACTIVE_MEMBER))
    .groupBy(students.cohortYear, latest.total);
  return rows.map(({ cohortYear, total, students, ...sums }) => ({
    cohortYear,
    total,
    students,
    sums,
  }));
}
