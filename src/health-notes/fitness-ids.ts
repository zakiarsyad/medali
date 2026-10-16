/*
 * The fixed facts of a fitness test. Read by the screen parts in the
 * browser and by the table definitions, so nothing here may take from
 * the database code.
 */

/** The lowest and the highest score of a fitness test, both whole. */
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

/** Each limit of "Ambang skor" is a whole number in this range. */
export const LIMIT_MIN = 1;
export const LIMIT_MAX = 100;

/** The categories of a fitness score, from the best down. */
export const FITNESS_CATEGORIES = [
  "excellent",
  "good",
  "attention",
  "medical",
] as const;

export type FitnessCategory = (typeof FITNESS_CATEGORIES)[number];

/**
 * "Ambang skor": the lowest score of Prima, of Baik and of Perlu
 * perhatian. Every score below the last is Perlu tindak lanjut medis.
 */
export interface FitnessLimits {
  excellentFrom: number;
  goodFrom: number;
  attentionFrom: number;
}

/** The three limits, in the order "Ambang skor" shows them. */
export const LIMIT_KEYS = [
  "excellentFrom",
  "goodFrom",
  "attentionFrom",
] as const;

export type LimitKey = (typeof LIMIT_KEYS)[number];

/**
 * The prototype's limits, in force until Kepala Unit sets the ones of
 * the campus's fitness test guide.
 */
export const STARTING_LIMITS: FitnessLimits = {
  excellentFrom: 85,
  goodFrom: 70,
  attentionFrom: 55,
};

/** The version of a form opened while the starting limits are in force. */
export const STARTING_VERSION = "start";
