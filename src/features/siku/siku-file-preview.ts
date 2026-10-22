import { PREVIEW_ROWS, PREVIEW_SKIPPED } from "@/files/csv-file";
import type { SikuFileRows, SkippedSikuRow } from "./siku-file";
import { REASON_WITH_BASIS, type SikuKind, type SikuReason } from "./siku-ids";

/** A ready row as the preview shows it. */
export interface SikuPreviewRow {
  row: number;
  nim: string;
  name: string;
  kind: SikuKind;
  reason: SikuReason;
  points: number;
  /** The keterangan of the file: the note, or the Dasar of a decision. */
  keterangan: string;
}

/** What the screen shows of a checked SIKU file, before anything is saved. */
export interface SikuFilePreview {
  ready: number;
  firstRows: SikuPreviewRow[];
  skipped: number;
  firstSkipped: SkippedSikuRow[];
  /**
   * The day the same file was saved before, by an upload still in force,
   * or null. Saving it again then asks for a confirm.
   */
  savedOn: string | null;
}

export function sikuPreviewOf(
  rows: SikuFileRows,
  savedOn: string | null,
): SikuFilePreview {
  const first = rows.ready.slice(0, PREVIEW_ROWS);
  return {
    ready: rows.ready.length,
    firstRows: first.map((row) => ({
      row: row.row,
      nim: row.nim,
      name: row.name,
      kind: row.kind,
      reason: row.reason,
      points: row.points,
      keterangan: row.reason === REASON_WITH_BASIS ? row.basis : row.note,
    })),
    skipped: rows.skipped.length,
    firstSkipped: rows.skipped.slice(0, PREVIEW_SKIPPED),
    savedOn,
  };
}
