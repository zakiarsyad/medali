import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { periodTitle } from "@/academic-periods/period-labels";
import { studentSemester } from "@/academic-periods/student-semester";
import { rerataOf, type Scores } from "@/character-scores/assessment-score";

type PeriodOf = Pick<AcademicPeriod, "startYear" | "term">;

/** The assessment of one period a student was assessed in. */
export interface AssessedPeriod extends PeriodOf {
  scores: Scores;
}

/** One point of "Riwayat per semester". */
export interface SemesterPoint {
  /** The student's semester in the period, the "n" of "Smt n". */
  semester: number;
  /** The period, such as Ganjil 2026/2027. */
  periodTitle: string;
  scores: Scores;
  rerata: number;
}

function oldestFirst(a: PeriodOf, b: PeriodOf): number {
  if (a.startYear !== b.startYear) return a.startYear - b.startYear;
  if (a.term === b.term) return 0;
  return a.term === "odd" ? -1 : 1;
}

/**
 * The points of a student's history, one per assessed period, from the
 * oldest period to the newest: Ganjil comes before Genap of one year.
 */
export function semesterPointsOf(
  cohortYear: number,
  periods: readonly AssessedPeriod[],
): SemesterPoint[] {
  const ordered = [...periods].sort(oldestFirst);
  return ordered.map((period) => ({
    semester: studentSemester(cohortYear, period),
    periodTitle: periodTitle(period),
    scores: period.scores,
    rerata: rerataOf(period.scores),
  }));
}
