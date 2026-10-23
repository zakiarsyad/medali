import { FITNESS_CATEGORIES, type FitnessCategory } from "./fitness-ids";
import { ILLNESSES, type Illness } from "./health-ids";
import { type CountShown, FEWEST_COUNTED, shownCount } from "./shown-count";

/*
 * How many students of a group are in each fitness category, as it may
 * leave the server: for the Dashboards and Dashboard asrama. Read by the
 * screen parts, so nothing here may take from the database code.
 */

/** What the database counts of the fitness of a group of students. */
export interface FitnessTally {
  /** The Aktif students of the group. */
  students: number;
  /** Those of them with a fitness test. */
  tested: number;
  /** How many are in each final category: the test's or the note's, the more serious. */
  byCategory: Record<FitnessCategory, number>;
}

/** The tally of the students a read puts under one key, such as their dorm. */
export interface GroupTally<Key extends string> {
  key: Key;
  tally: FitnessTally;
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

/** A count as it may show: as it is when no count is held back, or else `shownCount`. */
function heldCount(count: number, fewest: number): CountShown {
  return fewest > 1 ? shownCount(count) : count;
}

/** Each category's count as it may show: "<5" for 1 to 4 unless none is held back. */
export function shownByCategory(
  byCategory: Record<FitnessCategory, number>,
  fewest: number = FEWEST_COUNTED,
): Record<FitnessCategory, CountShown> {
  return {
    excellent: heldCount(byCategory.excellent, fewest),
    good: heldCount(byCategory.good, fewest),
    attention: heldCount(byCategory.attention, fewest),
    medical: heldCount(byCategory.medical, fewest),
  };
}

/**
 * The share of prima and baik among the students with a category, a
 * student with only a note among them, so it never passes 100.
 */
function fitShareOf(
  byCategory: Record<FitnessCategory, number>,
  fewest: number,
): number | null {
  const fit = byCategory.excellent + byCategory.good;
  if (heldCount(fit, fewest) === "<5") return null;
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
 * illness, so it is left out. Unless no count is held back, those of 1
 * to 4 students come after the others in the order of Riwayat penyakit,
 * so their order does not tell which of them is larger.
 */
function commonIllnesses(
  tallies: readonly IllnessTally[],
  fewest: number,
): IllnessCount[] {
  const named = tallies.filter(
    (tally) => tally.illness !== "other" && tally.students > 0,
  );
  const most = named.sort(byMostThenListOrder).slice(0, ILLNESSES_NAMED);
  const isSmall = (tally: IllnessTally) =>
    heldCount(tally.students, fewest) === "<5";
  const large = most.filter((tally) => !isSmall(tally));
  const small = most.filter(isSmall);
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
 * `fewest` students are tested, `FEWEST_COUNTED` unless said otherwise,
 * and then "<5" for any count of 1 to 4, so that nobody's health can be
 * told from it. `illnesses` is null for an account that may not count
 * them, and then no illness is given out.
 */
export function physicalRecapOf(
  tally: FitnessTally,
  illnesses: readonly IllnessTally[] | null,
  fewest: number = FEWEST_COUNTED,
): PhysicalRecap {
  const { students, tested, byCategory } = tally;
  if (tested === 0) return { kind: "untested", students };
  if (tested < fewest) return { kind: "too_few", students };
  return {
    kind: "shown",
    students,
    tested,
    untested: heldCount(students - tested, fewest),
    byCategory: shownByCategory(byCategory, fewest),
    fitShare: fitShareOf(byCategory, fewest),
    illnesses: illnesses === null ? null : commonIllnesses(illnesses, fewest),
  };
}
