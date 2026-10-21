import {
  FEWEST_IN_COHORT_UNFILTERED,
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

/**
 * The rows of "Capaian MEDALI per angkatan": one per angkatan and jalur,
 * the newest angkatan first and Reguler before Alih program. A row with
 * too few assessed students for a recap is left out, and so, without a
 * filter, is one with fewer than `FEWEST_IN_COHORT_UNFILTERED`.
 */
export function cohortRecaps(
  groups: readonly ScoreGroup[],
  filtered: boolean,
): CohortRecap[] {
  const rows: CohortRecap[] = [];
  for (const cohort of cohortsOf(groups).values()) {
    const [first] = cohort;
    const recap = recapOf(cohort);
    if (first === undefined || recap === null) continue;
    if (!shownWith(recap, filtered)) continue;
    rows.push({
      cohortYear: first.cohortYear,
      entryPath: first.entryPath,
      recap,
    });
  }
  return rows.sort(newestFirst);
}
