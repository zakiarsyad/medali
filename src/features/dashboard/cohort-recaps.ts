import {
  FEWEST_IN_COHORT_UNFILTERED,
  FEWEST_SHOWN,
  type Recap,
  recapOf,
  type ScoreGroup,
} from "./achievement-recap";
import type { EntryPath } from "./dashboard-address";

/** One row of a table per angkatan: an angkatan and jalur with its numbers. */
export interface CohortRow<R> {
  cohortYear: number;
  entryPath: EntryPath;
  recap: R;
}

/** One row of "Capaian MEDALI per angkatan". */
export type CohortRecap = CohortRow<Recap>;

/**
 * An angkatan and jalur that may be a row: how many of its students the
 * numbers count, and its numbers, or null while too few count for any.
 */
export interface CohortCandidate<R> {
  cohortYear: number;
  entryPath: EntryPath;
  counted: number;
  recap: R | null;
}

type ShownCandidate<R> = CohortCandidate<R> & { recap: R };

const PATH_ORDER: readonly EntryPath[] = ["regular", "transfer"];

/** The groups of each angkatan and jalur, together. */
export function cohortsOf<
  G extends Pick<CohortRow<unknown>, "cohortYear" | "entryPath">,
>(groups: readonly G[]): Map<string, G[]> {
  const cohorts = new Map<string, G[]>();
  for (const group of groups) {
    const key = `${group.cohortYear} ${group.entryPath}`;
    const held = cohorts.get(key) ?? [];
    held.push(group);
    cohorts.set(key, held);
  }
  return cohorts;
}

function newestFirst(
  one: CohortCandidate<unknown>,
  other: CohortCandidate<unknown>,
): number {
  if (one.cohortYear !== other.cohortYear) {
    return other.cohortYear - one.cohortYear;
  }
  return (
    PATH_ORDER.indexOf(one.entryPath) - PATH_ORDER.indexOf(other.entryPath)
  );
}

function shownWith(counted: number, filtered: boolean): boolean {
  if (filtered) return true;
  return counted >= FEWEST_IN_COHORT_UNFILTERED;
}

/**
 * Whether the rows left out count so few students that their numbers
 * would follow from the whole group less the rows shown.
 */
function leftOutTooFew(leftOut: number): boolean {
  return leftOut > 0 && leftOut < FEWEST_SHOWN;
}

/** The place of the smallest row; of rows alike, the last one shown. */
function smallestPlace(rows: readonly CohortCandidate<unknown>[]): number {
  let smallest = 0;
  let fewest = Number.POSITIVE_INFINITY;
  for (const [place, row] of rows.entries()) {
    if (row.counted > fewest) continue;
    smallest = place;
    fewest = row.counted;
  }
  return smallest;
}

/**
 * The rows of a table per angkatan, the newest angkatan first and Reguler
 * before Alih program. A candidate without numbers is left out, and so,
 * without a filter, is one that counts fewer than
 * `FEWEST_IN_COHORT_UNFILTERED` students. While the rows left out count 1
 * to 4 students, the smallest row shown is left out too, so that nobody's
 * numbers follow by subtraction from those of the whole group.
 */
export function shownCohorts<R>(
  candidates: readonly CohortCandidate<R>[],
  filtered: boolean,
): CohortRow<R>[] {
  const rows: ShownCandidate<R>[] = [];
  let leftOut = 0;
  for (const candidate of candidates) {
    const { recap } = candidate;
    if (recap === null || !shownWith(candidate.counted, filtered)) {
      leftOut += candidate.counted;
      continue;
    }
    rows.push({ ...candidate, recap });
  }
  rows.sort(newestFirst);
  while (rows.length > 0 && leftOutTooFew(leftOut)) {
    const [hidden] = rows.splice(smallestPlace(rows), 1);
    leftOut += hidden?.counted ?? 0;
  }
  return rows.map(({ cohortYear, entryPath, recap }) => ({
    cohortYear,
    entryPath,
    recap,
  }));
}

function assessedIn(cohort: readonly ScoreGroup[]): number {
  let assessed = 0;
  for (const group of cohort) {
    if (group.total !== null) assessed += group.students;
  }
  return assessed;
}

/**
 * The rows of "Capaian MEDALI per angkatan": one per angkatan and jalur
 * with enough assessed students, by the rules of `shownCohorts`.
 */
export function cohortRecaps(
  groups: readonly ScoreGroup[],
  filtered: boolean,
): CohortRecap[] {
  const candidates: CohortCandidate<Recap>[] = [];
  for (const cohort of cohortsOf(groups).values()) {
    const [first] = cohort;
    if (first === undefined) continue;
    candidates.push({
      cohortYear: first.cohortYear,
      entryPath: first.entryPath,
      counted: assessedIn(cohort),
      recap: recapOf(cohort),
    });
  }
  return shownCohorts(candidates, filtered);
}
