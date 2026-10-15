import { describe, expect, it } from "vitest";
import type { ReadyAssessmentRow } from "./assessment-file";
import { assessmentPreviewOf } from "./assessment-file-preview";

function readyRow(row: number): ReadyAssessmentRow {
  return {
    row,
    studentId: `id-${row}`,
    nim: `41212300${String(row).padStart(2, "0")}`,
    name: `Mahasiswa ${row}`,
    scores: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
  };
}

describe("assessmentPreviewOf", () => {
  it("shows the first six ready rows and at most 30 skipped ones, with how many there are and the NIM ganda", () => {
    const ready = Array.from({ length: 8 }, (_, at) => readyRow(at + 2));
    const skipped = Array.from({ length: 31 }, (_, at) => ({
      row: at + 10,
      nim: "",
      reason: "Skor harus angka 40–100.",
    }));

    const preview = assessmentPreviewOf({ ready, skipped, duplicates: 2 });

    expect(preview.ready).toBe(8);
    expect(preview.firstRows.map((row) => row.row)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(preview.firstRows[0]).toEqual({
      row: 2,
      nim: "4121230002",
      name: "Mahasiswa 2",
      scores: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
    });
    expect(preview.skipped).toBe(31);
    expect(preview.firstSkipped).toHaveLength(30);
    expect(preview.duplicates).toBe(2);
  });
});
