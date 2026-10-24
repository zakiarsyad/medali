import { STARTING_TEXTS } from "@/ui/medali-starting-texts";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { SCORE_MAX } from "./score-range";

/** How many indicators a mentoring score is given on. Each weighs the same. */
export const INDICATOR_COUNT = 6;

/** The lowest and the highest score a mentee is given on one indicator. */
export const INDICATOR_SCORE_MIN = 1;
export const INDICATOR_SCORE_MAX = 5;

/** Every score an indicator may be given, from the lowest up. */
export function indicatorScoreRange(): number[] {
  const scores: number[] = [];
  for (let score = INDICATOR_SCORE_MIN; score <= INDICATOR_SCORE_MAX; score++) {
    scores.push(score);
  }
  return scores;
}

/** The most characters the name and the sentence of an indicator may hold. */
export const NAME_MAX = 50;
export const SENTENCE_MAX = 200;

/** One indicator of the mentoring score: its name and the sentence that explains it. */
export interface ScoreIndicator {
  name: string;
  sentence: string;
}

/**
 * The indicators in force until Kepala Unit sets them: the six MEDALI
 * values, each with the text its first-level main indicator starts with
 * in Kurikulum.
 */
export const STARTING_INDICATORS: readonly ScoreIndicator[] = MEDALI_VALUES.map(
  ({ key, name }) => ({ name, sentence: STARTING_TEXTS[key][0] }),
);

/** Whether a number is a score of one indicator: a whole number from 1 to 5. */
export function isIndicatorScore(score: number): boolean {
  return (
    Number.isInteger(score) &&
    score >= INDICATOR_SCORE_MIN &&
    score <= INDICATOR_SCORE_MAX
  );
}

/** What one step of an indicator score is worth in the final score: 20. */
const POINTS_PER_STEP = SCORE_MAX / INDICATOR_SCORE_MAX;

/**
 * "Nilai akhir": the average of the six indicator scores times 20, to one
 * decimal, so from 20 to 100. Each indicator weighs the same. None while
 * the six are not all filled in with a score from 1 to 5.
 */
export function finalScoreOf(
  scores: readonly (number | null)[],
): number | null {
  if (scores.length !== INDICATOR_COUNT) return null;
  let sum = 0;
  for (const score of scores) {
    if (score === null || !isIndicatorScore(score)) return null;
    sum += score;
  }
  const final = (sum / INDICATOR_COUNT) * POINTS_PER_STEP;
  return Math.round(final * 10) / 10;
}

/** What each indicator score means, from the lowest up. A first draft, to be confirmed by the campus. */
export const INDICATOR_MEANINGS: readonly { score: number; meaning: string }[] =
  [
    { score: 1, meaning: "Sangat kurang" },
    { score: 2, meaning: "Kurang" },
    { score: 3, meaning: "Cukup" },
    { score: 4, meaning: "Baik" },
    { score: 5, meaning: "Sangat baik" },
  ];
