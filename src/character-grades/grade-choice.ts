/*
 * The choice of the students whose character grade reaches the pass
 * letter, or does not. Read by the screen parts in the browser, so
 * nothing here may take from the database code.
 */

export const GRADE_CHOICES = ["passing", "failing"] as const;

export type GradeChoice = (typeof GRADE_CHOICES)[number];

export const GRADE_CHOICE_WORDS: Record<GradeChoice, string> = {
  passing: "Memenuhi batas lulus",
  failing: "Belum memenuhi batas lulus",
};
