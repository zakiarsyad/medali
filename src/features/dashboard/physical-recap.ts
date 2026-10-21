import {
  FITNESS_CATEGORIES,
  type FitnessCategory,
} from "@/health-notes/fitness-ids";
import {
  type CountShown,
  FEWEST_COUNTED,
  shownCount,
} from "@/health-notes/shown-count";

/** What the database counts of the fitness of the students of the Dashboard. */
export interface FitnessTally {
  /** The Aktif students of the group. */
  students: number;
  /** Those of them with a fitness test. */
  tested: number;
  /** How many are in each final category: the test's or the note's, the more serious. */
  byCategory: Record<FitnessCategory, number>;
}

/** Kesehatan jasmani of a group, as it may leave the server. */
export type PhysicalRecap =
  | { kind: "untested"; students: number }
  | { kind: "too_few"; students: number }
  | {
      kind: "shown";
      students: number;
      tested: number;
      untested: CountShown;
      byCategory: Record<FitnessCategory, CountShown>;
      /** The percent "prima dan baik", or null while it would give a count of 1 to 4 back. */
      fitShare: number | null;
    };

function shownByCategory(
  byCategory: Record<FitnessCategory, number>,
): Record<FitnessCategory, CountShown> {
  return {
    excellent: shownCount(byCategory.excellent),
    good: shownCount(byCategory.good),
    attention: shownCount(byCategory.attention),
    medical: shownCount(byCategory.medical),
  };
}

/**
 * The share of prima and baik among the students with a category, a
 * student with only a note among them, so it never passes 100.
 */
function fitShareOf(
  byCategory: Record<FitnessCategory, number>,
): number | null {
  const fit = byCategory.excellent + byCategory.good;
  if (shownCount(fit) === "<5") return null;
  let categorised = 0;
  for (const category of FITNESS_CATEGORIES) {
    categorised += byCategory[category];
  }
  return Math.round((fit / categorised) * 100);
}

/**
 * Kesehatan jasmani as it may be shown: no count at all while fewer than
 * `FEWEST_COUNTED` students are tested, and "<5" for any count of 1 to 4,
 * so that nobody's health can be told from it.
 */
export function physicalRecapOf(tally: FitnessTally): PhysicalRecap {
  const { students, tested, byCategory } = tally;
  if (tested === 0) return { kind: "untested", students };
  if (tested < FEWEST_COUNTED) return { kind: "too_few", students };
  return {
    kind: "shown",
    students,
    tested,
    untested: shownCount(students - tested),
    byCategory: shownByCategory(byCategory),
    fitShare: fitShareOf(byCategory),
  };
}
