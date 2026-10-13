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
