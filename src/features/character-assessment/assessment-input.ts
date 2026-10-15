import type { Scores } from "@/character-scores/assessment-score";
import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import type { ValueKey } from "@/ui/medali-values";
import {
  ASSESSMENT_SOURCES,
  type AssessmentSource,
  NOTE_MAX_LENGTH,
  SCORE_MAX,
  SCORE_MIN,
} from "./assessment-ids";
import {
  INVALID_SCORES,
  NO_STUDENT,
  NOTE_TOO_LONG,
  UNKNOWN_SOURCE,
} from "./assessment-messages";

/** "Input capaian MEDALI" as the browser sent it, nothing of it trusted. */
export interface SentAssessment {
  studentId: string;
  scores: Record<ValueKey, string>;
  source: string;
  note: string;
}

export interface AssessmentInput {
  studentId: string;
  scores: Scores;
  source: AssessmentSource;
  /** Catatan penilai, trimmed; empty when nothing was noted. */
  note: string;
}

/** A whole number of two or three digits, without a leading zero. */
const WHOLE_SCORE = /^[1-9]\d{1,2}$/;

function scoreOf(sent: string): number | null {
  const typed = sent.trim();
  if (!WHOLE_SCORE.test(typed)) return null;
  const score = Number(typed);
  if (score < SCORE_MIN || score > SCORE_MAX) return null;
  return score;
}

function parseScores(sent: Record<ValueKey, string>): Parsed<Scores> {
  const M = scoreOf(sent.M);
  const E = scoreOf(sent.E);
  const D = scoreOf(sent.D);
  const A = scoreOf(sent.A);
  const L = scoreOf(sent.L);
  const I = scoreOf(sent.I);
  if (
    M === null ||
    E === null ||
    D === null ||
    A === null ||
    L === null ||
    I === null
  ) {
    return INVALID_SCORES;
  }
  return { ok: true, value: { M, E, D, A, L, I } };
}

export function sourceNamed(sent: string): AssessmentSource | null {
  return ASSESSMENT_SOURCES.find((each) => each === sent) ?? null;
}

/**
 * Checks "Input capaian MEDALI" as sent: a student, a whole score from
 * 40 to 100 for each value, a source of the fixed list, and a note of
 * 500 characters at most.
 */
export function parseAssessment(sent: SentAssessment): Parsed<AssessmentInput> {
  if (!isUuid(sent.studentId)) return NO_STUDENT;
  const scores = parseScores(sent.scores);
  if (!scores.ok) return scores;
  const source = sourceNamed(sent.source);
  if (source === null) return UNKNOWN_SOURCE;
  const note = sent.note.trim();
  if (note.length > NOTE_MAX_LENGTH) return NOTE_TOO_LONG;
  return {
    ok: true,
    value: { studentId: sent.studentId, scores: scores.value, source, note },
  };
}
