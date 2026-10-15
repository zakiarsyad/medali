import type { Scores } from "@/character-scores/assessment-score";
import { PREVIEW_ROWS, PREVIEW_SKIPPED } from "@/files/csv-file";
import type {
  AssessmentFileRows,
  SkippedAssessmentRow,
} from "./assessment-file";

/** A ready row as the preview shows it. */
export interface AssessmentPreviewRow {
  row: number;
  nim: string;
  name: string;
  scores: Scores;
}

/** What the screen shows of a checked assessment file, before anything is saved. */
export interface AssessmentFilePreview {
  ready: number;
  firstRows: AssessmentPreviewRow[];
  skipped: number;
  firstSkipped: SkippedAssessmentRow[];
  /** How many ready rows give way to a later row of the same NIM. */
  duplicates: number;
}

export function assessmentPreviewOf(
  rows: AssessmentFileRows,
): AssessmentFilePreview {
  const first = rows.ready.slice(0, PREVIEW_ROWS);
  return {
    ready: rows.ready.length,
    firstRows: first.map(({ row, nim, name, scores }) => ({
      row,
      nim,
      name,
      scores,
    })),
    skipped: rows.skipped.length,
    firstSkipped: rows.skipped.slice(0, PREVIEW_SKIPPED),
    duplicates: rows.duplicates,
  };
}
