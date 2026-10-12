import type { AssignmentStatus } from "./assignment-steps";

/** How many students of an angkatan wait for a group. */
export interface WaitingCohort {
  cohortYear: number;
  students: number;
}

/** What the list reads of the penetapan of an angkatan. */
export interface AssignmentFacts {
  cohortYear: number;
  status: AssignmentStatus;
  /** How many of its groups the account may see. */
  groups: number;
  /** How many Aktif students those groups hold. */
  members: number;
}

/** One row of the "Angkatan" list. */
export interface ListedCohort {
  cohortYear: number;
  /** The students the penetapan is about, among those the account may see. */
  students: number;
  /** Null for an angkatan whose groups are not formed yet. */
  status: AssignmentStatus | null;
  isNewest: boolean;
}

type Row = Omit<ListedCohort, "isNewest">;

function waitingIn(waiting: WaitingCohort[], cohortYear: number): number {
  const found = waiting.find((cohort) => cohort.cohortYear === cohortYear);
  return found?.students ?? 0;
}

/**
 * The row of an angkatan that has a penetapan, or null when a limited
 * account has nothing of its study programs in it. A fixed one counts the
 * members of its groups; any other counts the students who still wait.
 */
function rowWithAssignment(
  facts: AssignmentFacts,
  waiting: number,
  isLimited: boolean,
): Row | null {
  const { cohortYear, status } = facts;
  const hasNoGroupToSee = isLimited && facts.groups === 0;
  if (status === "fixed") {
    if (hasNoGroupToSee) return null;
    return { cohortYear, status, students: facts.members };
  }
  if (hasNoGroupToSee && waiting === 0) return null;
  return { cohortYear, status, students: waiting };
}

/**
 * The "Angkatan" list: every angkatan with a penetapan, and every other
 * angkatan with students who wait for a group, the newest first. For an
 * account held to its study programs the numbers given are already those
 * of its programs, and an angkatan with nothing of them is left out.
 */
export function cohortRows(
  waiting: WaitingCohort[],
  assignments: AssignmentFacts[],
  isLimited: boolean,
): ListedCohort[] {
  const rows: Row[] = [];
  const withAssignment = new Set<number>();
  for (const facts of assignments) {
    withAssignment.add(facts.cohortYear);
    const students = waitingIn(waiting, facts.cohortYear);
    const row = rowWithAssignment(facts, students, isLimited);
    if (row) rows.push(row);
  }
  for (const cohort of waiting) {
    const isListed = withAssignment.has(cohort.cohortYear);
    if (isListed || cohort.students === 0) continue;
    rows.push({ ...cohort, status: null });
  }
  rows.sort((a, b) => b.cohortYear - a.cohortYear);
  return rows.map((row, place) => ({ ...row, isNewest: place === 0 }));
}

/**
 * The angkatan the tab shows: the one asked for when the list has it, or
 * else the first of the list. Null for an empty list.
 */
export function chosenCohort(
  cohorts: ListedCohort[],
  askedYear: number | null,
): ListedCohort | null {
  const asked = cohorts.find((cohort) => cohort.cohortYear === askedYear);
  return asked ?? cohorts[0] ?? null;
}
