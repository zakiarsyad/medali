import {
  type Predicate,
  predicateOf,
  rerataFromTotal,
  rerataTenths,
  type Scores,
} from "@/character-scores/assessment-score";
import { MEDALI_VALUES } from "@/ui/medali-values";
import type { EntryPath } from "./dashboard-address";

/**
 * Below this many students no number of scores is shown, so that nobody's
 * own score can be worked out from it.
 */
export const FEWEST_SHOWN = 5;

/**
 * The fewest for Dashboard anak asuh, which holds no number back: its
 * Pengasuh sees each anak asuh's own values in Pengasuhan anyway.
 */
export const NONE_HELD_BACK = 1;

/** Without a filter, a cohort with fewer assessed students is left out. */
export const FEWEST_IN_COHORT_UNFILTERED = 20;

/**
 * Students who stand alike for the numbers of the Dashboard: of one
 * angkatan and jalur, with the same total of the six scores of their
 * latest assessment, or null for those with none.
 */
export interface ScoreGroup {
  cohortYear: number;
  entryPath: EntryPath;
  total: number | null;
  students: number;
  /** The sum of each latest score of the group. */
  sums: Scores;
  /** How many of them have an assessment before their latest one. */
  withEarlier: number;
  /** For those, the sum of each latest score less the one before it. */
  changes: Scores;
}

/** The numbers of a group of students, once enough of them are assessed. */
export interface Recap {
  /** The Aktif students of the group. */
  students: number;
  /** Those of them with an assessment. */
  assessed: number;
  /** The average of their Rerata, to one decimal. */
  rerata: number;
  /** How many of them have each predikat. */
  spread: Record<Predicate, number>;
  /** The average of each latest score. */
  averages: Scores;
  /**
   * The average change of each score since the assessment before, and the
   * averages less that change, or null while too few have one.
   */
  change: { changes: Scores; last: Scores } | null;
}

interface Tally {
  students: number;
  assessed: number;
  tenths: number;
  spread: Record<Predicate, number>;
  sums: Scores;
  withEarlier: number;
  changes: Scores;
}

function noScores(): Scores {
  return { M: 0, E: 0, D: 0, A: 0, L: 0, I: 0 };
}

function emptyTally(): Tally {
  return {
    students: 0,
    assessed: 0,
    tenths: 0,
    spread: { gold: 0, silver: 0, bronze: 0, guidance: 0 },
    sums: noScores(),
    withEarlier: 0,
    changes: noScores(),
  };
}

function addScores(to: Scores, more: Scores): void {
  for (const { key } of MEDALI_VALUES) to[key] += more[key];
}

function divided(scores: Scores, by: number): Scores {
  const each = noScores();
  for (const { key } of MEDALI_VALUES) each[key] = scores[key] / by;
  return each;
}

function less(scores: Scores, minus: Scores): Scores {
  const each = noScores();
  for (const { key } of MEDALI_VALUES) each[key] = scores[key] - minus[key];
  return each;
}

function tallyOf(groups: readonly ScoreGroup[]): Tally {
  const tally = emptyTally();
  for (const group of groups) {
    tally.students += group.students;
    if (group.total === null) continue;
    tally.assessed += group.students;
    tally.tenths += rerataTenths(group.total) * group.students;
    tally.spread[predicateOf(rerataFromTotal(group.total))] += group.students;
    addScores(tally.sums, group.sums);
    tally.withEarlier += group.withEarlier;
    addScores(tally.changes, group.changes);
  }
  return tally;
}

function changeOf(
  tally: Tally,
  averages: Scores,
  fewest: number,
): Recap["change"] {
  if (tally.withEarlier < Math.max(fewest, 1)) return null;
  const changes = divided(tally.changes, tally.withEarlier);
  return { changes, last: less(averages, changes) };
}

/**
 * The numbers of a group, or null while fewer than `fewest` of its
 * students are assessed, `FEWEST_SHOWN` unless said otherwise: then none
 * of them is given out. The Rerata average adds each student's Rerata as
 * shown, so it matches theirs.
 */
export function recapOf(
  groups: readonly ScoreGroup[],
  fewest: number = FEWEST_SHOWN,
): Recap | null {
  const tally = tallyOf(groups);
  if (tally.assessed === 0 || tally.assessed < fewest) return null;
  const averages = divided(tally.sums, tally.assessed);
  return {
    students: tally.students,
    assessed: tally.assessed,
    rerata: Math.round(tally.tenths / tally.assessed) / 10,
    spread: tally.spread,
    averages,
    change: changeOf(tally, averages, fewest),
  };
}
