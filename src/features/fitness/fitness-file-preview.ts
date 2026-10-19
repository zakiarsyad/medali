import { PREVIEW_ROWS, PREVIEW_SKIPPED } from "@/files/csv-file";
import { categoryOf } from "./fitness-category";
import type { FitnessFileRows, SkippedFitnessRow } from "./fitness-file";
import type { FitnessCategory, FitnessLimits } from "./fitness-ids";

/** A ready row as the preview shows it, with the category its score gives. */
export interface FitnessPreviewRow {
  row: number;
  nim: string;
  name: string;
  score: number;
  category: FitnessCategory;
}

/** What the screen shows of a checked fitness file, before anything is saved. */
export interface FitnessFilePreview {
  ready: number;
  firstRows: FitnessPreviewRow[];
  skipped: number;
  firstSkipped: SkippedFitnessRow[];
  /** How many ready rows give way to a later row of the same NIM. */
  duplicates: number;
}

export function fitnessPreviewOf(
  rows: FitnessFileRows,
  limits: FitnessLimits,
): FitnessFilePreview {
  const first = rows.ready.slice(0, PREVIEW_ROWS);
  return {
    ready: rows.ready.length,
    firstRows: first.map(({ row, nim, name, score }) => ({
      row,
      nim,
      name,
      score,
      category: categoryOf(score, limits),
    })),
    skipped: rows.skipped.length,
    firstSkipped: rows.skipped.slice(0, PREVIEW_SKIPPED),
    duplicates: rows.duplicates,
  };
}
