/** The lowest and the highest score a mentor can give a mentee. */
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

/** Whether a number is a mentoring score: a whole number in the range. */
export function isScore(number: number): boolean {
  return Number.isInteger(number) && number >= SCORE_MIN && number <= SCORE_MAX;
}
