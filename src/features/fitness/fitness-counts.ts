import { categoryOf } from "@/health-notes/fitness-category";
import type {
  FitnessCategory,
  FitnessLimits,
} from "@/health-notes/fitness-ids";
import { finalCategory } from "@/health-notes/health-category";
import type { NoteCategory } from "@/health-notes/health-ids";

/**
 * Students who stand alike for the numbers of the tab: how many, their
 * latest score and whether its test was in the year now running, or null
 * for those with none, and the category of their latest health note, or
 * null when it follows the test or there is none.
 */
export interface ScoreGroup {
  students: number;
  latest: { score: number; thisYear: boolean } | null;
  note: NoteCategory | null;
}

/** The numbers of the tab and of the panel "Kategori". */
export interface FitnessNumbers {
  students: number;
  /** Sudah dites (year): whose latest test is in the year now running. */
  testedThisYear: number;
  /** Rerata skor: the average of the latest scores, to one decimal, or null for none. */
  meanScore: number | null;
  /**
   * How many are in each final category, whatever the year of their
   * test: the more serious of the latest test and the latest note.
   */
  byCategory: Record<FitnessCategory, number>;
  /** Belum dites: with no test at all. */
  untested: number;
}

function testCategoryOf(
  group: ScoreGroup,
  limits: FitnessLimits,
): FitnessCategory | null {
  if (group.latest === null) return null;
  return categoryOf(group.latest.score, limits);
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
    const { category } = finalCategory(
      testCategoryOf(group, limits),
      group.note,
    );
    if (category !== "untested") byCategory[category] += group.students;
    if (group.latest === null) continue;
    tested += group.students;
    if (group.latest.thisYear) testedThisYear += group.students;
    total += group.latest.score * group.students;
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
