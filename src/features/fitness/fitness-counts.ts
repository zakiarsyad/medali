import { categoryOf } from "./fitness-category";
import type { FitnessCategory, FitnessLimits } from "./fitness-ids";

/**
 * Students who stand alike for the numbers of the tab: how many, and
 * their latest score and whether its test was in the year now running,
 * or null for those with none.
 */
export interface ScoreGroup {
  students: number;
  latest: { score: number; thisYear: boolean } | null;
}

/** The numbers of the tab and of the panel "Kategori". */
export interface FitnessNumbers {
  students: number;
  /** Sudah dites (year): whose latest test is in the year now running. */
  testedThisYear: number;
  /** Rerata skor: the average of the latest scores, to one decimal, or null for none. */
  meanScore: number | null;
  /** How many have their latest score in each category, whatever its year. */
  byCategory: Record<FitnessCategory, number>;
  /** Belum dites: with no test at all. */
  untested: number;
}

/**
 * Works out the numbers with the limits in force. Only a student's
 * latest score counts, and its category stays when a new year starts.
 */
export function countFitness(
  groups: readonly ScoreGroup[],
  limits: FitnessLimits,
): FitnessNumbers {
  const byCategory = { excellent: 0, good: 0, attention: 0, medical: 0 };
  let students = 0;
  let tested = 0;
  let testedThisYear = 0;
  let total = 0;
  for (const group of groups) {
    students += group.students;
    if (group.latest === null) continue;
    tested += group.students;
    if (group.latest.thisYear) testedThisYear += group.students;
    total += group.latest.score * group.students;
    byCategory[categoryOf(group.latest.score, limits)] += group.students;
  }
  const meanScore =
    tested === 0 ? null : Math.round((total / tested) * 10) / 10;
  return {
    students,
    testedThisYear,
    meanScore,
    byCategory,
    untested: students - tested,
  };
}
