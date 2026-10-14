import { describe, expect, it } from "vitest";
import type { ReadySikuRow } from "./siku-file";
import { sikuPreviewOf } from "./siku-file-preview";

function readyRow(row: number): ReadySikuRow {
  return {
    row,
    studentId: `id-${row}`,
    nim: `41212300${String(row).padStart(2, "0")}`,
    name: `Mahasiswa ${row}`,
    kind: "gain",
    reason: "knowledge_sharing",
    points: 2,
    note: "Catatan",
    basis: "",
  };
}

describe("sikuPreviewOf", () => {
  it("shows the first six ready rows and at most 30 skipped ones, with how many there are", () => {
    const ready = Array.from({ length: 8 }, (_, at) => readyRow(at + 2));
    const skipped = Array.from({ length: 31 }, (_, at) => ({
      row: at + 10,
      nim: "",
      reason: "Alasan tidak dikenali.",
    }));

    const preview = sikuPreviewOf({ ready, skipped }, null);

    expect(preview.ready).toBe(8);
    expect(preview.firstRows.map((row) => row.row)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(preview.skipped).toBe(31);
    expect(preview.firstSkipped).toHaveLength(30);
  });

  it("shows the keterangan of a row, whether it is the note or the Dasar", () => {
    const note = readyRow(2);
    const basis = {
      ...readyRow(3),
      kind: "loss" as const,
      reason: "director_decision" as const,
      note: "",
      basis: "SK-1",
    };

    const preview = sikuPreviewOf({ ready: [note, basis], skipped: [] }, null);

    expect(preview.firstRows.map((row) => row.keterangan)).toEqual([
      "Catatan",
      "SK-1",
    ]);
  });
});
