import { describe, expect, it } from "vitest";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import type { ReadyFitnessRow } from "./fitness-file";
import { fitnessPreviewOf } from "./fitness-file-preview";

function readyRow(row: number, score: number): ReadyFitnessRow {
  return {
    row,
    studentId: `id-${row}`,
    nim: `41212300${String(row).padStart(2, "0")}`,
    name: `Mahasiswa ${row}`,
    score,
  };
}

describe("fitnessPreviewOf", () => {
  it("shows the first six ready rows with the category each score gives, at most 30 skipped ones, with how many there are and the NIM ganda", () => {
    const scores = [85, 84, 70, 69, 55, 54, 90, 90];
    const ready = scores.map((score, at) => readyRow(at + 2, score));
    const skipped = Array.from({ length: 31 }, (_, at) => ({
      row: at + 10,
      nim: "",
      reason: "Skor harus angka 0–100.",
    }));

    const preview = fitnessPreviewOf(
      { ready, skipped, duplicates: 2 },
      STARTING_LIMITS,
    );

    expect(preview.ready).toBe(8);
    expect(preview.firstRows).toEqual([
      {
        row: 2,
        nim: "4121230002",
        name: "Mahasiswa 2",
        score: 85,
        category: "excellent",
      },
      {
        row: 3,
        nim: "4121230003",
        name: "Mahasiswa 3",
        score: 84,
        category: "good",
      },
      {
        row: 4,
        nim: "4121230004",
        name: "Mahasiswa 4",
        score: 70,
        category: "good",
      },
      {
        row: 5,
        nim: "4121230005",
        name: "Mahasiswa 5",
        score: 69,
        category: "attention",
      },
      {
        row: 6,
        nim: "4121230006",
        name: "Mahasiswa 6",
        score: 55,
        category: "attention",
      },
      {
        row: 7,
        nim: "4121230007",
        name: "Mahasiswa 7",
        score: 54,
        category: "medical",
      },
    ]);
    expect(preview.skipped).toBe(31);
    expect(preview.firstSkipped).toHaveLength(30);
    expect(preview.duplicates).toBe(2);
  });

  it("gives the category by the limits in force", () => {
    const preview = fitnessPreviewOf(
      { ready: [readyRow(2, 72)], skipped: [], duplicates: 0 },
      { ...STARTING_LIMITS, goodFrom: 75 },
    );

    expect(preview.firstRows[0]?.category).toBe("attention");
  });
});
