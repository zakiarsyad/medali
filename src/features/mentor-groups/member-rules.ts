import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { studentSemester } from "@/academic-periods/student-semester";
import type { students } from "@/db/schema";

type Student = typeof students.$inferSelect;

/** What the rules read of a member a group's page lists. */
type Member = Pick<Student, "status" | "className">;

/** A member on Cuti is listed with a tag, and is not counted. */
export function isOnLeave(member: Pick<Student, "status">): boolean {
  return member.status === "on_leave";
}

function isCounted(member: Pick<Student, "status">): boolean {
  return member.status === "active";
}

/** How many of the listed members count in the size of their group. */
export function countedMembers(members: Pick<Student, "status">[]): number {
  return members.filter(isCounted).length;
}

/** How many kelas akademik the counted members are spread over. */
export function academicClasses(members: Member[]): number {
  const classes = new Set<string>();
  for (const member of members) {
    if (isCounted(member) && member.className) classes.add(member.className);
  }
  return classes.size;
}

/** The semester a member is in now, or null while no academic period runs. */
export function memberSemester(
  member: Pick<Student, "cohortYear">,
  period: Pick<AcademicPeriod, "startYear" | "term"> | null,
): number | null {
  if (period === null) return null;
  return studentSemester(member.cohortYear, period);
}
