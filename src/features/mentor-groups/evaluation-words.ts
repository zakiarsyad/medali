import type { EvaluationScores } from "./evaluation-aspects";
import {
  evaluationAverage,
  evaluationResult,
  RESULT_TITLES,
  shownAverage,
} from "./evaluation-result";
import type { SavedEvaluation } from "./save-evaluation";

/** What "Simpan evaluasi" says once it is saved. */
export function savedWords(saved: SavedEvaluation): string {
  return `Evaluasi ${saved.mentorName} disimpan: ${RESULT_TITLES[saved.result]}.`;
}

/**
 * What the form of a replacement says when the saving of an evaluation
 * opened it: the words of that save, read back from what is stored for
 * the period the address names. Null when nothing is stored for it or its
 * result is not Kurang: the address alone is never believed.
 */
export function poorSaveWords(
  mentorName: string,
  stored: EvaluationScores[],
): string | null {
  const [saved] = stored;
  if (saved === undefined) return null;
  const result = evaluationResult(saved);
  if (result !== "poor") return null;
  return savedWords({ mentorName, result });
}

/** What a list shows where a group or a mentor has no evaluation. */
export const NOT_EVALUATED = "Belum dievaluasi";

/** A result with its average as a badge writes it, such as "Baik · 86,5". */
export function resultWords(scores: EvaluationScores): string {
  const title = RESULT_TITLES[evaluationResult(scores)];
  return `${title} · ${shownAverage(evaluationAverage(scores))}`;
}

/** What is added to a result of Kurang. */
export const POOR_RESULT_NOTE =
  "Hasil ini dapat menjadi dasar penggantian pengasuh.";
