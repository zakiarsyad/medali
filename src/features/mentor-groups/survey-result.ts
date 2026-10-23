import {
  FEWEST_ANSWERS_SHOWN,
  HIGHEST_SCORE,
  SURVEY_STATEMENTS,
} from "@/mentoring/survey-statements";
import { type EvaluationResult, resultOf } from "./evaluation-result";

/*
 * The result of the student survey for one group and mentor. Each number
 * is kept to the one decimal the screens show, a half going up, and the
 * numbers made from others are worked out from what is shown, so a
 * number never disagrees with those beside it. Every number is worked
 * out in tenths, as whole numbers, so no fraction is lost on the way.
 */

/** The answers of a group for one mentor, as the database adds them up. */
export interface AnswerSums {
  answers: number;
  /** The sum of every score of every answer. */
  total: number;
}

/** A number in tenths, back as the number it stands for. */
function fromTenths(tenths: number): number {
  return Math.round(tenths) / 10;
}

/**
 * Whether a group with this many answers shows its averages and its
 * suggestions. Below it they could be traced to one student.
 */
export function isShownCount(answers: number): boolean {
  return answers >= FEWEST_ANSWERS_SHOWN;
}

/** "Umpan balik" out of 5: the mean of every score. Null while hidden. */
export function feedbackOutOfFive(sums: AnswerSums): number | null {
  if (!isShownCount(sums.answers)) return null;
  const scores = sums.answers * SURVEY_STATEMENTS.length;
  return fromTenths((sums.total * 10) / scores);
}

/**
 * "Umpan balik" as 0 to 100: the mean of every score divided by 5 times
 * 100, from the scores themselves. Null while hidden.
 */
export function feedbackScore(sums: AnswerSums): number | null {
  if (!isShownCount(sums.answers)) return null;
  const highest = sums.answers * SURVEY_STATEMENTS.length * HIGHEST_SCORE;
  return fromTenths((sums.total * 1000) / highest);
}

/**
 * "Nilai evaluasi": Capaian karakter and Umpan balik joined by the weight
 * of Capaian karakter, the rest of 100 going to Umpan balik. Null without
 * one of the two.
 */
export function surveyScore(
  achievement: number | null,
  feedback: number | null,
  achievementWeight: number,
): number | null {
  if (achievement === null || feedback === null) return null;
  const achievementPart = Math.round(achievement * 10) * achievementWeight;
  const feedbackPart = Math.round(feedback * 10) * (100 - achievementWeight);
  return fromTenths((achievementPart + feedbackPart) / 100);
}

/** The share of the members who answered, in whole percent. Null without members. */
export function respondentShare(
  answers: number,
  members: number,
): number | null {
  if (members === 0) return null;
  return Math.round((answers * 100) / members);
}

/** The answers of a group for one mentor, statement by statement. */
export interface StatementSums {
  answers: number;
  /** The sum of the scores of each statement, in the order of the statements. */
  sums: number[];
}

/** "Rata-rata per pernyataan", out of 5. Null while hidden. */
export function statementAverages(statements: StatementSums): number[] | null {
  if (!isShownCount(statements.answers)) return null;
  return statements.sums.map((sum) =>
    fromTenths((sum * 10) / statements.answers),
  );
}

/** What is known of a group and mentor before its result is worked out. */
export interface SurveyGroupFacts extends AnswerSums {
  /** How many Aktif members the group holds. */
  members: number;
  /** "Capaian karakter": the group's Rerata MEDALI, or null when nobody is assessed. */
  achievement: number | null;
}

/** Every number of a group and mentor in "Hasil evaluasi per kelompok". */
export interface SurveyGroupResult {
  answers: number;
  members: number;
  /** "Responden" in percent, or null for a group without members. */
  share: number | null;
  achievement: number | null;
  /** Null, as every number after it, for a group with fewer than 3 answers. */
  feedbackOutOfFive: number | null;
  feedback: number | null;
  score: number | null;
  /** "Predikat": Baik, Cukup or Kurang by Nilai evaluasi. */
  result: EvaluationResult | null;
}

/**
 * The result of a group and mentor with the weight of Capaian karakter
 * of the period. A group with fewer than 3 answers gets no Umpan balik,
 * Nilai evaluasi or Predikat.
 */
export function surveyGroupResult(
  facts: SurveyGroupFacts,
  achievementWeight: number,
): SurveyGroupResult {
  const feedback = feedbackScore(facts);
  const score = surveyScore(facts.achievement, feedback, achievementWeight);
  return {
    answers: facts.answers,
    members: facts.members,
    share: respondentShare(facts.answers, facts.members),
    achievement: facts.achievement,
    feedbackOutOfFive: feedbackOutOfFive(facts),
    feedback,
    score,
    result: score === null ? null : resultOf(score),
  };
}
