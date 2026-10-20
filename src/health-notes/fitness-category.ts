/*
 * The category of a fitness score. Read by the screen parts in the
 * browser, which show the category of a score as it is typed, and by the
 * server, so nothing here may take from the database code.
 */

import {
  type FitnessCategory,
  type FitnessLimits,
  SCORE_MAX,
  SCORE_MIN,
} from "./fitness-ids";

/** A category, or "Belum dites" for a student with no test. */
export type ShownCategory = FitnessCategory | "untested";

/** The lowest and the highest score of a category, both counted in. */
export interface ScoreRange {
  lowest: number;
  highest: number;
}

/**
 * The category of a score: Prima from the limit of Prima, Baik from that
 * of Baik, Perlu perhatian from that of Perlu perhatian, and Perlu
 * tindak lanjut medis below it.
 */
export function categoryOf(
  score: number,
  limits: FitnessLimits,
): FitnessCategory {
  if (score >= limits.excellentFrom) return "excellent";
  if (score >= limits.goodFrom) return "good";
  if (score >= limits.attentionFrom) return "attention";
  return "medical";
}

/** The scores a category holds with these limits. */
export function categoryRange(
  category: FitnessCategory,
  limits: FitnessLimits,
): ScoreRange {
  switch (category) {
    case "excellent":
      return { lowest: limits.excellentFrom, highest: SCORE_MAX };
    case "good":
      return { lowest: limits.goodFrom, highest: limits.excellentFrom - 1 };
    case "attention":
      return { lowest: limits.attentionFrom, highest: limits.goodFrom - 1 };
    case "medical":
      return { lowest: SCORE_MIN, highest: limits.attentionFrom - 1 };
  }
}
