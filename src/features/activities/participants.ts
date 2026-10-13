import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { studentSemester } from "@/academic-periods/student-semester";

/** How many students of one angkatan count as participants. */
export interface CohortCount {
  cohortYear: number;
  students: number;
}

export type PeriodParts = Pick<AcademicPeriod, "startYear" | "term">;

/**
 * Whether the students of an angkatan are in a semester during a period.
 * An angkatan that starts after the first year of the period is in none:
 * its students were not students yet, though the semester rule alone
 * would put them in semester 1.
 */
export function isInSemester(
  cohortYear: number,
  semester: number,
  period: PeriodParts,
): boolean {
  if (cohortYear > period.startYear) return false;
  return studentSemester(cohortYear, period) === semester;
}

/**
 * How many students take part in a schedule of an activity of a semester:
 * those of every angkatan that is in that semester during the period the
 * schedule keeps. None while no period is known.
 */
export function countParticipants(
  counts: readonly CohortCount[],
  semester: number,
  period: PeriodParts | null,
): number {
  if (period === null) return 0;
  let participants = 0;
  for (const count of counts) {
    if (!isInSemester(count.cohortYear, semester, period)) continue;
    participants += count.students;
  }
  return participants;
}
