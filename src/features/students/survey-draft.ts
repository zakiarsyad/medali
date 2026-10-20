import { SURVEY_STATEMENTS } from "@/mentoring/survey-statements";
import { isScore } from "./own-survey-rules";

/**
 * A survey that is filled in and not sent yet, kept on the device so a
 * refresh does not lose it. Nothing of it reaches the server before
 * "Kirim survei". A score of 0 is a statement not answered yet.
 */
export interface SurveyDraft {
  scores: number[];
  suggestion: string;
}

/** Eight statements, none answered. */
export function emptyScores(): number[] {
  return SURVEY_STATEMENTS.map(() => 0);
}

function draftOf(kept: unknown): SurveyDraft | null {
  if (typeof kept !== "object" || kept === null) return null;
  if (!("scores" in kept) || !Array.isArray(kept.scores)) return null;
  if (!("suggestion" in kept) || typeof kept.suggestion !== "string") {
    return null;
  }
  const sent: unknown[] = kept.scores;
  const scores = emptyScores().map((none, index) => {
    const score = sent[index];
    return isScore(score) ? score : none;
  });
  return { scores, suggestion: kept.suggestion };
}

/**
 * The draft kept on the device, or null. A device that keeps nothing,
 * refuses, or holds something else gives null, never a broken page.
 */
export function readDraft(
  storage: Storage | null,
  key: string,
): SurveyDraft | null {
  try {
    const kept = storage?.getItem(key);
    if (kept == null) return null;
    return draftOf(JSON.parse(kept));
  } catch {
    return null;
  }
}

/** Keeps the draft. A device that refuses keeps nothing, and says nothing. */
export function keepDraft(
  storage: Storage | null,
  key: string,
  draft: SurveyDraft,
): void {
  try {
    storage?.setItem(key, JSON.stringify(draft));
  } catch {
    // A full or refused storage only means the draft is not kept.
  }
}

/** Forgets the draft, once the answer is sent. */
export function dropDraft(storage: Storage | null, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    // A refused storage holds no draft to forget.
  }
}
