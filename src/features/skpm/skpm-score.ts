/** The highest Nilai SKPM. */
export const SKPM_MAX = 100;

/** A number rounded to one decimal. */
export function oneDecimal(amount: number): number {
  return Math.round(amount * 10) / 10;
}

/**
 * Nilai SKPM: a student's total points ÷ "Poin untuk nilai 100" × 100,
 * at most 100, to one decimal.
 */
export function skpmScoreOf(total: number, pointsForHundred: number): number {
  const score = (total / pointsForHundred) * SKPM_MAX;
  return oneDecimal(Math.min(SKPM_MAX, score));
}
