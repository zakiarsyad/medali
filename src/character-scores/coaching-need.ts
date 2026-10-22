import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import { rerataOf, type Scores } from "./assessment-score";

/*
 * Who needs coaching after their latest character assessment, how much,
 * and in which value. Read by the screen parts in the browser, so nothing
 * here may take from the database code.
 */

/** A student is listed below this Rerata. */
export const LISTED_BELOW_RERATA = 65;

/** A student is also listed when one score is below this. */
export const LISTED_BELOW_SCORE = 58;

/** Below this Rerata the coaching is Intensif; up to the listing one, Sedang. */
export const INTENSIVE_BELOW_RERATA = 60;

/** Intensif, Sedang and Ringan, the most serious first. */
export const COACHING_LEVELS = ["intensive", "moderate", "light"] as const;

export type CoachingLevel = (typeof COACHING_LEVELS)[number];

export interface CoachingNeed {
  level: CoachingLevel;
  /** "Aspek terlemah": the value with the lowest score. */
  weakest: ValueKey;
}

/** The value with the lowest score, the first in MEDALI order on a tie. */
export function weakestValueOf(scores: Scores): ValueKey {
  let weakest: ValueKey = MEDALI_VALUES[0].key;
  for (const { key } of MEDALI_VALUES) {
    if (scores[key] < scores[weakest]) weakest = key;
  }
  return weakest;
}

/** "Paling menonjol": the value with the highest score, the first in MEDALI order on a tie. */
export function strongestValueOf(scores: Scores): ValueKey {
  let strongest: ValueKey = MEDALI_VALUES[0].key;
  for (const { key } of MEDALI_VALUES) {
    if (scores[key] > scores[strongest]) strongest = key;
  }
  return strongest;
}

function levelOf(rerata: number): CoachingLevel {
  if (rerata < INTENSIVE_BELOW_RERATA) return "intensive";
  if (rerata < LISTED_BELOW_RERATA) return "moderate";
  return "light";
}

/**
 * The coaching a student needs by their latest scores, or null when they
 * are not listed: listed when the Rerata, to one decimal, is below 65 or
 * one score is below 58.
 */
export function coachingNeedOf(scores: Scores): CoachingNeed | null {
  const rerata = rerataOf(scores);
  const weakest = weakestValueOf(scores);
  const hasLowScore = scores[weakest] < LISTED_BELOW_SCORE;
  if (rerata >= LISTED_BELOW_RERATA && !hasLowScore) return null;
  return { level: levelOf(rerata), weakest };
}
