/** The numbers above "Skema bobot", of the students the account sees. */
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
  /** How many a Ringan or Sedang penalty holds at 70. */
  limited: number;
}

/** What the numbers are worked out from, as the database counts them. */
export interface GradeTotals {
  students: number;
  complete: number;
  passing: number;
  adjusted: number;
  limited: number;
  /** The sum of the worked-out Nilai akhir, or null with none. */
  finalSum: number | null;
}

/**
 * The numbers. A "Belum lengkap" student is left out of Rerata nilai
 * akhir and of who meets the pass letter: nothing is guessed for them.
 */
export function gradeNumbersFrom(totals: GradeTotals): GradeNumbers {
  const { students, complete, passing, adjusted, limited, finalSum } = totals;
  const meanFinal =
    complete === 0 || finalSum === null
      ? null
      : Math.round((finalSum / complete) * 10) / 10;
  return {
    students,
    meanFinal,
    complete,
    passing,
    adjusted,
    incomplete: students - complete,
    limited,
  };
}

/** The share of worked-out grades that pass, as a whole percent, or null. */
export function passingPercent(numbers: GradeNumbers): number | null {
  if (numbers.complete === 0) return null;
  return Math.round((numbers.passing / numbers.complete) * 100);
}
