import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { levelOf } from "@/academic-periods/stages";
import { studentSemester } from "@/academic-periods/student-semester";

/*
 * How many active students each semester and tahap holds. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

const SEMESTERS = 8;

/** The active students of one angkatan. */
export interface CohortCount {
  cohortYear: number;
  students: number;
}

/** The period the semesters are counted in, or null while none runs. */
export type CountedPeriod = Pick<AcademicPeriod, "startYear" | "term"> | null;

/** How many active students are in each semester, from semester 1 to 8. */
export type SemesterCounts = readonly number[];

/** The active students in one semester. */
export function studentsIn(counts: SemesterCounts, semester: number): number {
  return counts[semester - 1] ?? 0;
}

/**
 * Puts each angkatan in its semester of the running period. While no
 * period runs, no student has a semester, so every semester holds none.
 */
export function semesterCounts(
  cohorts: readonly CohortCount[],
  period: CountedPeriod,
): SemesterCounts {
  const counts: number[] = new Array(SEMESTERS).fill(0);
  if (period === null) return counts;
  for (const cohort of cohorts) {
    const place = studentSemester(cohort.cohortYear, period) - 1;
    counts[place] = (counts[place] ?? 0) + cohort.students;
  }
  return counts;
}

/**
 * The Target peserta of a PPKS activity that has none typed: the active
 * students of its semester. A semester without any, such as one whose
 * new angkatan is not put in yet, takes the semester before it.
 */
export function autoTarget(counts: SemesterCounts, semester: number): number {
  const inSemester = studentsIn(counts, semester);
  if (inSemester > 0) return inSemester;
  return studentsIn(counts, semester - 1);
}

/** The active students whose semester falls in a tahap. */
export function tahapCount(counts: SemesterCounts, tahapNo: number): number {
  let total = 0;
  for (let semester = 1; semester <= SEMESTERS; semester++) {
    if (levelOf(semester) === tahapNo) total += studentsIn(counts, semester);
  }
  return total;
}
