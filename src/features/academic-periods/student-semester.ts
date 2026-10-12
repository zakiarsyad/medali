import type { AcademicPeriod } from "./academic-period";

const FIRST_SEMESTER = 1;
const LAST_SEMESTER = 8;
const SEMESTERS_A_YEAR = 2;

/**
 * The semester a student is in during a period, from their angkatan year
 * only: two semesters for each year since, then the first or the second
 * one of the year. Never below 1 and never above 8.
 */
export function studentSemester(
  cohortYear: number,
  period: Pick<AcademicPeriod, "startYear" | "term">,
): number {
  const years = period.startYear - cohortYear;
  const inYear = period.term === "odd" ? 1 : 2;
  const semester = years * SEMESTERS_A_YEAR + inYear;
  return Math.min(LAST_SEMESTER, Math.max(FIRST_SEMESTER, semester));
}
