import {
  FEWEST_IN_COHORT_UNFILTERED,
  FEWEST_SHOWN,
  type Recap,
  recapOf,
  type ScoreGroup,
} from "./achievement-recap";
import type { EntryPath } from "./dashboard-address";

/** One row of "Capaian MEDALI per angkatan". */
export interface CohortRecap {
  cohortYear: number;
  entryPath: EntryPath;
  recap: Recap;
}

const PATH_ORDER: readonly EntryPath[] = ["regular", "transfer"];

function cohortsOf(groups: readonly ScoreGroup[]): Map<string, ScoreGroup[]> {
  const cohorts = new Map<string, ScoreGroup[]>();
  for (const group of groups) {
    const key = `${group.cohortYear} ${group.entryPath}`;
    const held = cohorts.get(key) ?? [];
    held.push(group);
    cohorts.set(key, held);
  }
  return cohorts;
}

function newestFirst(one: CohortRecap, other: CohortRecap): number {
  if (one.cohortYear !== other.cohortYear) {
    return other.cohortYear - one.cohortYear;
  }
  return (
    PATH_ORDER.indexOf(one.entryPath) - PATH_ORDER.indexOf(other.entryPath)
  );
}

function shownWith(recap: Recap, filtered: boolean): boolean {
  if (filtered) return true;
  return recap.assessed >= FEWEST_IN_COHORT_UNFILTERED;
}

function assessedIn(cohort: readonly ScoreGroup[]): number {
  let assessed = 0;
  for (const group of cohort) {
    if (group.total !== null) assessed += group.students;
  }
  return assessed;
}

/**
 * Whether the rows left out hold so few assessed students that their
 * scores would follow from the whole group less the rows shown.
 */
function leftOutTooFew(leftOut: number): boolean {
  return leftOut > 0 && leftOut < FEWEST_SHOWN;
}

/** The place of the smallest row; of rows alike, the last one shown. */
function smallestPlace(rows: readonly CohortRecap[]): number {
  let smallest = 0;
  let fewest = Number.POSITIVE_INFINITY;
  for (const [place, row] of rows.entries()) {
    if (row.recap.assessed > fewest) continue;
    smallest = place;
    fewest = row.recap.assessed;
  }
  return smallest;
}

/**
 * The rows of "Capaian MEDALI per angkatan": one per angkatan and jalur,
 * the newest angkatan first and Reguler before Alih program. A row with
 * too few assessed students for a recap is left out, and so, without a
 * filter, is one with fewer than `FEWEST_IN_COHORT_UNFILTERED`. While the
 * rows left out hold 1 to 4 assessed students, the smallest row shown is
 * left out too, so that nobody's scores follow by subtraction from the
 * numbers of the whole group.
 */
export function cohortRecaps(
  groups: readonly ScoreGroup[],
  filtered: boolean,
): CohortRecap[] {
  const rows: CohortRecap[] = [];
  let leftOut = 0;
  for (const cohort of cohortsOf(groups).values()) {
    const [first] = cohort;
    const recap = recapOf(cohort);
    if (first === undefined || recap === null || !shownWith(recap, filtered)) {
      leftOut += assessedIn(cohort);
      continue;
    }
    rows.push({
      cohortYear: first.cohortYear,
      entryPath: first.entryPath,
      recap,
    });
  }
  rows.sort(newestFirst);
  while (rows.length > 0 && leftOutTooFew(leftOut)) {
    const [hidden] = rows.splice(smallestPlace(rows), 1);
    leftOut += hidden?.recap.assessed ?? 0;
  }
  return rows;
}
