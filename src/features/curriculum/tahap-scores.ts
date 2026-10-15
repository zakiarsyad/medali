import { levelOf } from "@/academic-periods/stages";
import { studentSemester } from "@/academic-periods/student-semester";
import { rerataTenths, type Scores } from "@/character-scores/assessment-score";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import type { CountedPeriod } from "./student-numbers";

/*
 * The scores of a tahap. Read by the screen parts in the browser, so
 * nothing here may take from the database code.
 */

/**
 * Assessed active students who stand alike for the scores: of one
 * angkatan, with the same total of the six scores of their latest
 * assessment. `sums` adds up each of their latest scores.
 */
export interface ScoreGroup {
  cohortYear: number;
  total: number;
  students: number;
  sums: Scores;
}

/** The averages of a tahap, each to one decimal. */
export interface TahapScores {
  /** The average of each nilai. */
  values: Record<ValueKey, number>;
  /** Rerata tahap: the average of each student's Rerata. */
  rerata: number;
}

function toOneDecimal(tenths: number): number {
  return Math.round(tenths) / 10;
}

/**
 * The averages of the assessed students whose semester falls in a tahap,
 * from their latest assessment. Null when the tahap has none, and while
 * no period runs, as no student has a semester then.
 */
export function tahapScores(
  groups: readonly ScoreGroup[],
  period: CountedPeriod,
  tahapNo: number,
): TahapScores | null {
  if (period === null) return null;
  let students = 0;
  let tenths = 0;
  const sums = { M: 0, E: 0, D: 0, A: 0, L: 0, I: 0 };
  for (const group of groups) {
    const semester = studentSemester(group.cohortYear, period);
    if (levelOf(semester) !== tahapNo) continue;
    students += group.students;
    tenths += rerataTenths(group.total) * group.students;
    for (const { key } of MEDALI_VALUES) sums[key] += group.sums[key];
  }
  if (students === 0) return null;
  const values = { ...sums };
  for (const { key } of MEDALI_VALUES) {
    values[key] = toOneDecimal((sums[key] * 10) / students);
  }
  return { values, rerata: toOneDecimal(tenths / students) };
}
