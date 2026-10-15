import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";

/*
 * The rules of a character assessment. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** A whole score from 40 to 100 for each MEDALI value. */
export type Scores = Record<ValueKey, number>;

/** The predikat of the Skala predikat MEDALI, highest first. */
export const PREDICATES = ["gold", "silver", "bronze", "guidance"] as const;

export type Predicate = (typeof PREDICATES)[number];

/** The lowest Rerata of each predikat but the last, which takes the rest. */
const GOLD_FROM = 85;
const SILVER_FROM = 75;
const BRONZE_FROM = 65;

/** A slider's level: 1 below 65, 2 from 65, 3 from 75, 4 from 85. */
export type Level = 1 | 2 | 3 | 4;

export function totalOf(scores: Scores): number {
  let total = 0;
  for (const { key } of MEDALI_VALUES) total += scores[key];
  return total;
}

/**
 * Rerata in tenths, as a whole number: kept whole, adding the Rerata of
 * many students stays exact.
 */
export function rerataTenths(total: number): number {
  return Math.round((total * 10) / MEDALI_VALUES.length);
}

/** Rerata of six scores whose total is given, to one decimal. */
export function rerataFromTotal(total: number): number {
  return rerataTenths(total) / 10;
}

/** Rerata: the plain average of the six scores, to one decimal. */
export function rerataOf(scores: Scores): number {
  return rerataFromTotal(totalOf(scores));
}

/**
 * The predikat of a Rerata. Given the Rerata as shown, to one decimal:
 * for whole scores that is never on the other side of a boundary from
 * the unrounded average.
 */
export function predicateOf(rerata: number): Predicate {
  if (rerata >= GOLD_FROM) return "gold";
  if (rerata >= SILVER_FROM) return "silver";
  if (rerata >= BRONZE_FROM) return "bronze";
  return "guidance";
}

/**
 * The level a slider's score falls in, which picks its main indicator.
 * The levels have the boundaries of the predikat, as in the prototype.
 */
export function levelOf(score: number): Level {
  if (score >= GOLD_FROM) return 4;
  if (score >= SILVER_FROM) return 3;
  if (score >= BRONZE_FROM) return 2;
  return 1;
}
