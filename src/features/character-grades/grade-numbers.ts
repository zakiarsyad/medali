import type { GradeRow } from "./grade-list";

/** The four numbers above "Skema bobot", of the students the account sees. */
export interface GradeNumbers {
  /** How many Aktif students they are. */
  students: number;
  /** Rerata nilai akhir to one decimal, or null with no worked-out grade. */
  meanFinal: number | null;
  /** How many have a worked-out grade, and how many of those pass. */
  complete: number;
  passing: number;
  /** How many an entry in force gained or lost SIKU points. */
  adjusted: number;
  /** How many are "Belum lengkap". */
  incomplete: number;
}

/**
 * The four numbers. A "Belum lengkap" student is left out of Rerata nilai
 * akhir and of who meets the pass letter: nothing is guessed for them.
 */
export function gradeNumbersOf(rows: readonly GradeRow[]): GradeNumbers {
  let sum = 0;
  let complete = 0;
  let passing = 0;
  let adjusted = 0;
  for (const row of rows) {
    if (row.siku.adjusted) adjusted += 1;
    if (!row.grade.complete) continue;
    complete += 1;
    sum += row.grade.final;
    if (row.grade.passes) passing += 1;
  }
  const meanFinal =
    complete === 0 ? null : Math.round((sum / complete) * 10) / 10;
  return {
    students: rows.length,
    meanFinal,
    complete,
    passing,
    adjusted,
    incomplete: rows.length - complete,
  };
}

/** The share of worked-out grades that pass, as a whole percent, or null. */
export function passingPercent(numbers: GradeNumbers): number | null {
  if (numbers.complete === 0) return null;
  return Math.round((numbers.passing / numbers.complete) * 100);
}
