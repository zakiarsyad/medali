import {
  HIGHEST_SCORE,
  LOWEST_SCORE,
  SUGGESTION_MAX,
  SURVEY_STATEMENTS,
} from "@/mentoring/survey-statements";
import type { Parsed } from "@/parsed";

/** An answer to the survey as it is kept. */
export interface CheckedSurveyAnswer {
  /** A score of 1 to 5 for each statement, in their order. */
  scores: number[];
  /** Null when no suggestion was typed. */
  suggestion: string | null;
}

/** Whether a value sent for a statement is one of its scores. */
export function isScore(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isInteger(value)) return false;
  return value >= LOWEST_SCORE && value <= HIGHEST_SCORE;
}

/** How many statements have a score. */
export function answeredCount(scores: readonly unknown[]): number {
  return scores.filter(isScore).length;
}

/**
 * The first statement, counted from 1, without a score, or null when
 * each has one. Anything that is not a score counts as no answer.
 */
export function firstUnanswered(scores: readonly unknown[]): number | null {
  for (let index = 0; index < SURVEY_STATEMENTS.length; index++) {
    if (!isScore(scores[index])) return index + 1;
  }
  return null;
}

export function unansweredWords(statement: number): string {
  return `Pernyataan ${statement} belum dijawab.`;
}

export const SUGGESTION_TOO_LONG = `Saran untuk pengasuh paling banyak ${SUGGESTION_MAX} karakter.`;

/**
 * "Kirim survei": a score for each of the eight statements and an
 * optional suggestion. What was sent is not trusted.
 */
export function checkSurveyAnswer(
  scores: readonly unknown[],
  suggestion: unknown,
): Parsed<CheckedSurveyAnswer> {
  const unanswered = firstUnanswered(scores);
  if (unanswered !== null) {
    return { ok: false, error: unansweredWords(unanswered) };
  }
  const typed = typeof suggestion === "string" ? suggestion.trim() : "";
  if (typed.length > SUGGESTION_MAX) {
    return { ok: false, error: SUGGESTION_TOO_LONG };
  }
  return {
    ok: true,
    value: {
      scores: scores.slice(0, SURVEY_STATEMENTS.length) as number[],
      suggestion: typed === "" ? null : typed,
    },
  };
}
