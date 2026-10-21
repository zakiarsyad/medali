/*
 * The fixed facts of the character grade scheme. Read by the screen parts
 * in the browser and by the table definitions, so nothing here may take
 * from the database code.
 */

/** The letters of a character grade, from the best down. */
export const GRADE_LETTERS = ["A", "B", "C", "D", "E"] as const;

export type GradeLetter = (typeof GRADE_LETTERS)[number];

/** The letters that have a lower limit; E is every score below D. */
export const LIMITED_LETTERS = ["A", "B", "C", "D"] as const;

export type LimitedLetter = (typeof LIMITED_LETTERS)[number];

/** The four parts of a final grade, each with its weight. */
export const GRADE_PARTS = ["attendance", "mentoring", "siku", "skpm"] as const;

export type GradePart = (typeof GRADE_PARTS)[number];

/**
 * The rules of the semester character grade: the weight of each part in
 * percent, the lowest score of each letter, and the letter needed to pass.
 */
export interface GradeScheme {
  weights: Record<GradePart, number>;
  lowerLimits: Record<LimitedLetter, number>;
  passLetter: GradeLetter;
}

/** Each weight and each lower limit is a whole number in this range. */
export const SCHEME_NUMBER_MIN = 0;
export const SCHEME_NUMBER_MAX = 100;

/** What the four weights must add up to. */
export const WEIGHT_TOTAL = 100;

/**
 * The prototype's numbers, in force until Kepala Unit sets the real ones
 * of KEP-220.
 */
export const STARTING_SCHEME: GradeScheme = {
  weights: { attendance: 25, mentoring: 25, siku: 25, skpm: 25 },
  lowerLimits: { A: 85, B: 70, C: 60, D: 50 },
  passLetter: "B",
};

/** The version of a form opened while the starting scheme is in force. */
export const STARTING_VERSION = "start";
