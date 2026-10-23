import {
  EVALUATION_ASPECTS,
  type EvaluationScores,
} from "./evaluation-aspects";

/** Baik, Cukup and Kurang, the best first. */
export type EvaluationResult = "good" | "fair" | "poor";

export const RESULT_TITLES: Record<EvaluationResult, string> = {
  good: "Baik",
  fair: "Cukup",
  poor: "Kurang",
};

/** The average from which a result is Baik. */
export const GOOD_FROM = 80;
/** The average from which a result is Cukup. Below it the result is Kurang. */
export const FAIR_FROM = 65;

function totalOf(scores: EvaluationScores): number {
  let total = 0;
  for (const aspect of EVALUATION_ASPECTS) total += scores[aspect];
  return total;
}

/**
 * "Nilai evaluasi": the mean of the four values, kept to the one decimal
 * the screens show, a half going up. The values are whole numbers, so
 * ten times their mean ends in a quarter at most and rounds without fault.
 */
export function evaluationAverage(scores: EvaluationScores): number {
  const tenths = (totalOf(scores) * 10) / EVALUATION_ASPECTS.length;
  return Math.round(tenths) / 10;
}

/** The result of an average: Baik from 80, Cukup from 65, else Kurang. */
export function resultOf(average: number): EvaluationResult {
  if (average >= GOOD_FROM) return "good";
  if (average >= FAIR_FROM) return "fair";
  return "poor";
}

/**
 * The result of four values. It judges the average that is shown, so a
 * result never disagrees with the number beside it.
 */
export function evaluationResult(scores: EvaluationScores): EvaluationResult {
  return resultOf(evaluationAverage(scores));
}

/** An average as the screens write it, such as 79,8. */
export function shownAverage(average: number): string {
  return average.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
