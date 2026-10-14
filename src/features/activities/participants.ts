import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { studentSemester } from "@/academic-periods/student-semester";

/** How many students of one angkatan count as participants. */
export interface CohortCount {
  cohortYear: number;
  students: number;
}

export type PeriodParts = Pick<AcademicPeriod, "startYear" | "term">;

/**
 * Whether the students of an angkatan were students during a period: an
 * angkatan that starts after the first year of the period was not yet.
 */
export function wasStudentIn(
  cohortYear: number,
  period: Pick<PeriodParts, "startYear">,
): boolean {
  return cohortYear <= period.startYear;
}

/**
 * The semester the students of an angkatan are in during a period. An
 * angkatan whose students were not students yet is in none, though the
 * semester rule alone would put them in semester 1.
 */
export function semesterIn(
  cohortYear: number,
  period: PeriodParts,
): number | null {
  if (!wasStudentIn(cohortYear, period)) return null;
  return studentSemester(cohortYear, period);
}

/** Whether the students of an angkatan are in a semester during a period. */
export function isInSemester(
  cohortYear: number,
  semester: number,
  period: PeriodParts,
): boolean {
  return semesterIn(cohortYear, period) === semester;
}

/** A period with the semester one student is in while it runs. */
export interface PeriodSemester {
  periodId: string;
  semester: number;
}

/**
 * The semester a student of an angkatan is in during each of the periods
 * in which they were a student. A schedule is meant for them when its
 * period and the semester of its activity are one of these.
 */
export function semestersByPeriod(
  cohortYear: number,
  periods: readonly (PeriodParts & Pick<AcademicPeriod, "id">)[],
): PeriodSemester[] {
  const semesters: PeriodSemester[] = [];
  for (const period of periods) {
    const semester = semesterIn(cohortYear, period);
    if (semester === null) continue;
    semesters.push({ periodId: period.id, semester });
  }
  return semesters;
}

/**
 * The angkatan, among those that have students, that a schedule of an
 * activity of a semester is meant for: those in that semester during the
 * period the schedule keeps.
 */
export function meantCohortYears(
  counts: readonly CohortCount[],
  semester: number,
  period: PeriodParts,
): number[] {
  return counts
    .map((count) => count.cohortYear)
    .filter((cohortYear) => isInSemester(cohortYear, semester, period));
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
