import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { studentSemester } from "@/academic-periods/student-semester";
import type { students } from "@/db/schema";

type Student = typeof students.$inferSelect;

/** The running period as the semester rule reads it, or null when none runs. */
export type RunningPeriod = Pick<AcademicPeriod, "startYear" | "term"> | null;

/**
 * The semester a student is in now, or null when there is none to show: a
 * Non aktif student has no semester, and nobody has one while no academic
 * period runs.
 */
export function semesterNow(
  student: Pick<Student, "cohortYear" | "status">,
  period: RunningPeriod,
): number | null {
  if (period === null) return null;
  if (student.status === "inactive") return null;
  return studentSemester(student.cohortYear, period);
}
