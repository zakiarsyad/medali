import { PREVIEW_ROWS, PREVIEW_SKIPPED } from "@/files/csv-file";
import type { ReadySkpmRow, SkippedSkpmRow, SkpmFileRows } from "./skpm-file";

/** What the screen shows of a checked SKPM file, before anything is saved. */
export interface SkpmFilePreview {
  ready: number;
  /** How many different students the ready rows hold. */
  students: number;
  firstRows: ReadySkpmRow[];
  skipped: number;
  firstSkipped: SkippedSkpmRow[];
  /**
   * The day the same file was saved before, by an upload still in force,
   * or null. Saving it again in "Tambahkan" then asks for a confirm.
   */
  savedOn: string | null;
}

/** How many different students some ready rows hold. */
export function studentsIn(rows: readonly ReadySkpmRow[]): number {
  return new Set(rows.map((row) => row.studentId)).size;
}

export function skpmPreviewOf(
  rows: SkpmFileRows,
  savedOn: string | null,
): SkpmFilePreview {
  return {
    ready: rows.ready.length,
    students: studentsIn(rows.ready),
    firstRows: rows.ready.slice(0, PREVIEW_ROWS),
    skipped: rows.skipped.length,
    firstSkipped: rows.skipped.slice(0, PREVIEW_SKIPPED),
    savedOn,
  };
}
