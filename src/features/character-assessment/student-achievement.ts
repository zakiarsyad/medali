import { and, eq } from "drizzle-orm";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Scores } from "@/character-scores/assessment-score";
import { earlierAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students } from "@/db/schema";
import type { PenaltyKind } from "@/discipline-penalties/penalty-kinds";
import { readLimitsOf } from "@/discipline-penalties/read-limits";
import { readAssessmentPick } from "./assessment-picks";
import {
  type LatestAssessment,
  readLatestOf,
  scoresOf,
} from "./latest-assessments";

/** "Capaian karakter" of one student, for their detail. */
export interface StudentAchievement {
  studentId: string;
  /** The student's semester now, or null when there is none to show. */
  semester: number | null;
  /** The latest assessment, or null for a student never assessed. */
  latest: LatestAssessment | null;
  /** The scores of the assessment before it, or null for none. */
  earlier: Scores | null;
  /** Whether "Input asesmen" opens the form for this student. */
  mayAssess: boolean;
  /**
   * The penalty that holds the scores at 70, or null for none: its
   * Kategori and Jenjang only, so a role that may not read discipline
   * records sees the limit and never the Uraian.
   */
  limit: PenaltyKind | null;
}

type ShownStudent = Pick<typeof students.$inferSelect, "cohortYear" | "status">;

/** A student within the rows of the character panels, or null. */
export async function readShownStudent(
  db: Database,
  account: AccountForAccess,
  studentId: string,
): Promise<ShownStudent | null> {
  const rows = rowLimitForAction(account, "view_student_character_panels");
  const [found] = await db
    .select({ cohortYear: students.cohortYear, status: students.status })
    .from(students)
    .where(and(eq(students.id, studentId), visibleTo(rows)));
  return found ?? null;
}

async function readEarlier(
  db: Database,
  studentId: string,
): Promise<Scores | null> {
  const earlier = earlierAssessments(db);
  const [found] = await db
    .select()
    .from(earlier)
    .where(eq(earlier.studentId, studentId));
  return found ? scoresOf(found) : null;
}

async function semesterOn(
  db: Database,
  student: ShownStudent,
  today: string,
): Promise<number | null> {
  if (student.status === "inactive") return null;
  const running = runningPeriodOn(await readAcademicPeriods(db), today);
  if (!running) return null;
  return studentSemester(student.cohortYear, running);
}

/**
 * "Capaian karakter" of one student, as of `today`. Null for an account
 * without the character panels and for a student outside its rows: the
 * same answer whether or not the student was assessed, so a refusal
 * tells nothing. "Input asesmen" is offered only where the account may
 * assess the student, who must be Aktif. The scores are held at 70 under
 * a Ringan or Sedang penalty.
 */
export async function readStudentAchievement(
  db: Database,
  account: AccountForAccess,
  studentId: string,
  today: string,
): Promise<StudentAchievement | null> {
  if (!may(account.roles, "view_student_character_panels")) return null;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return null;
  const student = await readShownStudent(db, account, studentId);
  if (!student) return null;
  const [latest, earlier, semester, pick, limits] = await Promise.all([
    readLatestOf(db, [studentId]),
    readEarlier(db, studentId),
    semesterOn(db, student, today),
    readAssessmentPick(db, account, studentId),
    readLimitsOf(db, [studentId]),
  ]);
  return {
    studentId,
    semester,
    latest: latest.get(studentId) ?? null,
    earlier,
    mayAssess: pick !== null,
    limit: limits.get(studentId) ?? null,
  };
}
