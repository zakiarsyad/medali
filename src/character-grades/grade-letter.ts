import {
  GRADE_LETTERS,
  type GradeLetter,
  type GradePart,
  type GradeScheme,
  LIMITED_LETTERS,
} from "./scheme-ids";

/** The first letter, from A down, whose lower limit the score reaches. */
export function letterOf(score: number, scheme: GradeScheme): GradeLetter {
  for (const letter of LIMITED_LETTERS) {
    if (score >= scheme.lowerLimits[letter]) return letter;
  }
  return "E";
}

/** Whether a letter is the pass letter or better. */
export function passes(letter: GradeLetter, passLetter: GradeLetter): boolean {
  return GRADE_LETTERS.indexOf(letter) <= GRADE_LETTERS.indexOf(passLetter);
}

/** What the four weights add up to. */
export function weightTotal(weights: Record<GradePart, number>): number {
  return weights.attendance + weights.mentoring + weights.siku + weights.skpm;
}
