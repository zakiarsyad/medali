import { desc, eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { academicPeriods, characterAssessments } from "@/db/schema";
import { readLimitsOf } from "@/discipline-penalties/read-limits";
import { limitedScores } from "@/discipline-penalties/score-limit";
import { scoresOf } from "./latest-assessments";
import {
  type AssessedPeriod,
  type SemesterPoint,
  semesterPointsOf,
} from "./semester-points";
import { readShownStudent } from "./student-achievement";

/**
 * The latest assessment of each period a student was assessed in: the
 * one saved last, as for the student's latest assessment overall.
 */
async function readAssessedPeriods(
  db: Database,
  studentId: string,
): Promise<AssessedPeriod[]> {
  const rows = await db
    .selectDistinctOn([characterAssessments.periodId], {
      startYear: academicPeriods.startYear,
      term: academicPeriods.term,
      scoreM: characterAssessments.scoreM,
      scoreE: characterAssessments.scoreE,
      scoreD: characterAssessments.scoreD,
      scoreA: characterAssessments.scoreA,
      scoreL: characterAssessments.scoreL,
      scoreI: characterAssessments.scoreI,
    })
    .from(characterAssessments)
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, characterAssessments.periodId),
    )
    .where(eq(characterAssessments.studentId, studentId))
    .orderBy(
      characterAssessments.periodId,
      desc(characterAssessments.enteredAt),
      desc(characterAssessments.id),
    );
  return rows.map((row) => ({
    startYear: row.startYear,
    term: row.term,
    scores: scoresOf(row),
  }));
}

/**
 * "Riwayat per semester" of one student: a point for each period they
 * were assessed in, the oldest first, and none for a student never
 * assessed. Under a Ringan or Sedang penalty every point is held at 70,
 * as the card is. Null for an account without the character panels and for a
 * student outside its rows, the same answer whether or not the student
 * was assessed, so a refusal tells nothing.
 */
export async function readStudentScoreHistory(
  db: Database,
  account: AccountForAccess,
  studentId: string,
): Promise<SemesterPoint[] | null> {
  if (!may(account.roles, "view_student_character_panels")) return null;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return null;
  const student = await readShownStudent(db, account, studentId);
  if (!student) return null;
  const periods = await readAssessedPeriods(db, studentId);
  const limits = await readLimitsOf(db, [studentId]);
  const limited = limits.has(studentId);
  const shown = periods.map((period) => ({
    ...period,
    scores: limitedScores(period.scores, limited),
  }));
  return semesterPointsOf(student.cohortYear, shown);
}
