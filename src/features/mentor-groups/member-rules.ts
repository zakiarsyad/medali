import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { studentSemester } from "@/academic-periods/student-semester";
import type { students } from "@/db/schema";

type Student = typeof students.$inferSelect;

/** A member on Cuti is listed with a tag, and is not counted. */
export function isOnLeave(member: Pick<Student, "status">): boolean {
  return member.status === "on_leave";
}

/** The semester a member is in now, or null while no academic period runs. */
export function memberSemester(
  member: Pick<Student, "cohortYear">,
  period: Pick<AcademicPeriod, "startYear" | "term"> | null,
): number | null {
  if (period === null) return null;
  return studentSemester(member.cohortYear, period);
}
