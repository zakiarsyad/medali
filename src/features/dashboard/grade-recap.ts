import { letterOf, passes } from "@/character-grades/grade-letter";
import {
  GRADE_PARTS,
  type GradeLetter,
  type GradePart,
  type GradeScheme,
} from "@/character-grades/scheme-ids";
import { FEWEST_SHOWN } from "./achievement-recap";
import { oneDecimal } from "./achievement-words";
import {
  type CohortCandidate,
  type CohortRow,
  cohortsOf,
  shownCohorts,
} from "./cohort-recaps";
import type { EntryPath } from "./dashboard-address";

/**
 * Students who stand alike for the grade numbers of the Dashboard: of one
 * angkatan and jalur, with the same Nilai akhir, held at 70 where a
 * penalty limits it, or null for those whose grade is "Belum lengkap".
 */
export interface GradeGroup {
  cohortYear: number;
  entryPath: EntryPath;
  final: number | null;
  students: number;
  /** How many of them a Ringan or Sedang penalty holds at 70. */
  limited: number;
  /** The sum of each part of the group, as it stands before any limit. */
  sums: Record<GradePart, number>;
}

/** The grade numbers of a group with enough worked-out grades. */
export interface ShownGrades {
  kind: "shown";
  /** The students with a worked-out grade. */
  graded: number;
  /** How many a Ringan or Sedang penalty holds at 70, "Belum lengkap" or not. */
  limited: number;
  /** Rerata nilai akhir, to one decimal. */
  meanFinal: number;
  /** The whole percent of worked-out grades that meet the pass letter. */
  passing: number;
  /** How many have each letter. */
  letters: Record<GradeLetter, number>;
  /** The students whose grade is "Belum lengkap", left out of every number but `limited`. */
  incomplete: number;
  /** The average of each part over the worked-out grades. */
  parts: Record<GradePart, number>;
}

/**
 * Nilai karakter of a group: no number at all while nobody has a
 * worked-out grade, or while fewer than `FEWEST_SHOWN` have one.
 */
export type GradeRecap = { kind: "none" } | { kind: "too_few" } | ShownGrades;

interface Tally {
  students: number;
  graded: number;
  limited: number;
  finalSum: number;
  passing: number;
  letters: Record<GradeLetter, number>;
  sums: Record<GradePart, number>;
}

function noParts(): Record<GradePart, number> {
  return { attendance: 0, mentoring: 0, siku: 0, skpm: 0 };
}

function emptyTally(): Tally {
  return {
    students: 0,
    graded: 0,
    limited: 0,
    finalSum: 0,
    passing: 0,
    letters: { A: 0, B: 0, C: 0, D: 0, E: 0 },
    sums: noParts(),
  };
}

function averages(tally: Tally): Record<GradePart, number> {
  const each = noParts();
  for (const part of GRADE_PARTS) each[part] = tally.sums[part] / tally.graded;
  return each;
}

function tallyOf(groups: readonly GradeGroup[], scheme: GradeScheme): Tally {
  const tally = emptyTally();
  for (const group of groups) {
    tally.students += group.students;
    tally.limited += group.limited;
    if (group.final === null) continue;
    const letter = letterOf(group.final, scheme);
    tally.graded += group.students;
    tally.finalSum += group.final * group.students;
    tally.letters[letter] += group.students;
    if (passes(letter, scheme.passLetter)) tally.passing += group.students;
    for (const part of GRADE_PARTS) tally.sums[part] += group.sums[part];
  }
  return tally;
}

/**
 * The grade numbers of a group by the scheme in force, held back while
 * fewer than `fewest` have a worked-out grade. A "Belum lengkap" student
 * is left out of every average, letter and percent, as on Penilaian
 * karakter, but counts among those held at 70.
 */
export function gradeRecapOf(
  groups: readonly GradeGroup[],
  scheme: GradeScheme,
  fewest: number = FEWEST_SHOWN,
): GradeRecap {
  const tally = tallyOf(groups, scheme);
  if (tally.graded === 0) return { kind: "none" };
  if (tally.graded < fewest) return { kind: "too_few" };
  return {
    kind: "shown",
    graded: tally.graded,
    limited: tally.limited,
    meanFinal: oneDecimal(tally.finalSum / tally.graded),
    passing: Math.round((tally.passing / tally.graded) * 100),
    letters: tally.letters,
    incomplete: tally.students - tally.graded,
    parts: averages(tally),
  };
}

/** One row of "Nilai karakter per angkatan". */
export type GradeCohort = CohortRow<ShownGrades>;

function gradedIn(cohort: readonly GradeGroup[]): number {
  let graded = 0;
  for (const group of cohort) {
    if (group.final !== null) graded += group.students;
  }
  return graded;
}

/**
 * The rows of "Nilai karakter per angkatan": one per angkatan and jalur,
 * by the cohort rule of section 1, counted by the worked-out grades.
 */
export function gradeCohorts(
  groups: readonly GradeGroup[],
  scheme: GradeScheme,
  filtered: boolean,
): GradeCohort[] {
  const candidates: CohortCandidate<ShownGrades>[] = [];
  for (const cohort of cohortsOf(groups).values()) {
    const [first] = cohort;
    if (first === undefined) continue;
    const recap = gradeRecapOf(cohort, scheme);
    candidates.push({
      cohortYear: first.cohortYear,
      entryPath: first.entryPath,
      counted: gradedIn(cohort),
      recap: recap.kind === "shown" ? recap : null,
    });
  }
  return shownCohorts(candidates, filtered);
}
