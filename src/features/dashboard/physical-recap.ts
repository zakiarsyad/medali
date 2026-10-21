import {
  FITNESS_CATEGORIES,
  type FitnessCategory,
} from "@/health-notes/fitness-ids";
import { ILLNESSES, type Illness } from "@/health-notes/health-ids";
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

/** How many students of the two lower categories have an illness in their latest note. */
export interface IllnessTally {
  illness: Illness;
  students: number;
}

/** An illness of the line under "Kategori tes kebugaran", as it may be shown. */
export interface IllnessCount {
  illness: Illness;
  students: CountShown;
}

/** How many illnesses the line names at most, as in the prototype. */
export const ILLNESSES_NAMED = 4;

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
      /** The most common illnesses, or null for an account that may not count them. */
      illnesses: IllnessCount[] | null;
    };

/** Kesehatan jasmani of a group with enough tested students for counts. */
export type ShownPhysical = Extract<PhysicalRecap, { kind: "shown" }>;

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

function byMostThenListOrder(a: IllnessTally, b: IllnessTally): number {
  if (a.students !== b.students) return b.students - a.students;
  return ILLNESSES.indexOf(a.illness) - ILLNESSES.indexOf(b.illness);
}

function byListOrder(a: IllnessTally, b: IllnessTally): number {
  return ILLNESSES.indexOf(a.illness) - ILLNESSES.indexOf(b.illness);
}

/**
 * The most common named illnesses, most first. "Lainnya" names no
 * illness, so it is left out. Those of 1 to 4 students come after the
 * others in the order of Riwayat penyakit, so their order does not tell
 * which of them is larger.
 */
function commonIllnesses(tallies: readonly IllnessTally[]): IllnessCount[] {
  const named = tallies.filter(
    (tally) => tally.illness !== "other" && tally.students > 0,
  );
  const most = named.sort(byMostThenListOrder).slice(0, ILLNESSES_NAMED);
  const large = most.filter((tally) => shownCount(tally.students) !== "<5");
  const small = most.filter((tally) => shownCount(tally.students) === "<5");
  return [
    ...large,
    ...small.sort(byListOrder).map(({ illness }) => ({
      illness,
      students: "<5" as const,
    })),
  ];
}

/**
 * Kesehatan jasmani as it may be shown: no count at all while fewer than
 * `FEWEST_COUNTED` students are tested, and "<5" for any count of 1 to 4,
 * so that nobody's health can be told from it. `illnesses` is null for an
 * account that may not count them, and then no illness is given out.
 */
export function physicalRecapOf(
  tally: FitnessTally,
  illnesses: readonly IllnessTally[] | null,
): PhysicalRecap {
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
    illnesses: illnesses === null ? null : commonIllnesses(illnesses),
  };
}
