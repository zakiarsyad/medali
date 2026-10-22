import { limitedScore } from "@/discipline-penalties/score-limit";
import { letterOf, passes } from "./grade-letter";
import {
  GRADE_PARTS,
  type GradeLetter,
  type GradePart,
  type GradeScheme,
} from "./scheme-ids";

/** The score of each part, or null for a part that is missing. */
export type PartScores = Record<GradePart, number | null>;

/**
 * A student's semester character grade: "Belum lengkap" while a part is
 * missing, otherwise Nilai akhir with its letter and whether it passes.
 */
export type CharacterGrade =
  | { complete: false }
  | {
      complete: true;
      final: number;
      letter: GradeLetter;
      passes: boolean;
      /** Nilai akhir before the limit of a penalty, only when it lowered it. */
      limitedFrom?: number;
    };

const INCOMPLETE: CharacterGrade = { complete: false };

/** Nilai akhir: the sum of each part × its weight ÷ 100, to one decimal. */
export function finalScoreOf(
  scores: Record<GradePart, number>,
  weights: GradeScheme["weights"],
): number {
  let sum = 0;
  for (const part of GRADE_PARTS) sum += scores[part] * weights[part];
  return Math.round(sum / 10) / 10;
}

function completeScores(scores: PartScores): Record<GradePart, number> | null {
  const { attendance, mentoring, siku, skpm } = scores;
  if (attendance === null || mentoring === null) return null;
  if (siku === null || skpm === null) return null;
  return { attendance, mentoring, siku, skpm };
}

/**
 * The grade of a student by the scheme. Nothing fills a missing part: the
 * grade is "Belum lengkap" instead. For a `limited` student, under a
 * Ringan or Sedang penalty, Nilai akhir is at most 70. The letter is that
 * of Nilai akhir as it is shown, to one decimal and after the limit, so
 * the two never disagree.
 */
export function gradeOf(
  scores: PartScores,
  scheme: GradeScheme,
  limited = false,
): CharacterGrade {
  const complete = completeScores(scores);
  if (complete === null) return INCOMPLETE;
  const unlimited = finalScoreOf(complete, scheme.weights);
  const final = limitedScore(unlimited, limited);
  const letter = letterOf(final, scheme);
  const grade: CharacterGrade = {
    complete: true,
    final,
    letter,
    passes: passes(letter, scheme.passLetter),
  };
  if (final === unlimited) return grade;
  return { ...grade, limitedFrom: unlimited };
}

/**
 * The SKPM part of a student: missing while no SKPM upload counts at all,
 * and 0 for a student with no rows once one does.
 */
export function skpmPartOf(
  score: number | undefined,
  uploadsInForce: number,
): number | null {
  if (uploadsInForce === 0) return null;
  return score ?? 0;
}
