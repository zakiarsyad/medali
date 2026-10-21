import type { AcademicPeriod } from "./academic-period";
import { levelOf } from "./stages";
import { studentSemester } from "./student-semester";

/** The running period as the semester rule reads it, or null when none runs. */
type RunningPeriod = Pick<AcademicPeriod, "startYear" | "term"> | null;

/**
 * The angkatan years whose students are in each tahap now, by the number
 * of the tahap. A tahap without an angkatan is left out, and so is every
 * tahap while no academic period runs: nobody is in a tahap then.
 */
export type StageCohorts = ReadonlyMap<number, readonly number[]>;

export function stageCohorts(
  cohortYears: readonly number[],
  period: RunningPeriod,
): StageCohorts {
  const cohorts = new Map<number, number[]>();
  if (period === null) return cohorts;
  for (const year of cohortYears) {
    const stageNo = levelOf(studentSemester(year, period));
    const years = cohorts.get(stageNo) ?? [];
    years.push(year);
    cohorts.set(stageNo, years);
  }
  return cohorts;
}

/**
 * How many students each tahap holds, from how many each angkatan holds.
 */
export function heldByStage(
  heldByCohort: ReadonlyMap<number, number>,
  cohorts: StageCohorts,
): Map<number, number> {
  const held = new Map<number, number>();
  for (const [stageNo, years] of cohorts) {
    let inStage = 0;
    for (const year of years) inStage += heldByCohort.get(year) ?? 0;
    held.set(stageNo, inStage);
  }
  return held;
}
