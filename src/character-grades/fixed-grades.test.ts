import { describe, expect, it } from "vitest";
import { closingCounts, fixedGradeOf } from "./fixed-grades";
import type { GradeRow } from "./grade-list";

function row(more: Partial<GradeRow> = {}): GradeRow {
  return {
    student: { id: "s1", name: "Ani", nim: "1", program: "Prodi" },
    attendance: { percent: 90, attended: 9, counted: 10 },
    mentoring: 80,
    siku: { score: 66, adjusted: true, note: "SIKU 65 +1" },
    skpm: 72,
    grade: { complete: true, final: 77, letter: "B", passes: true },
    limited: false,
    ...more,
  };
}

describe("fixedGradeOf", () => {
  it("keeps each part, Nilai akhir, Huruf and pass of a complete grade", () => {
    expect(fixedGradeOf(row())).toEqual({
      studentId: "s1",
      attendance: 90,
      attended: 9,
      counted: 10,
      mentoring: 80,
      siku: 66,
      sikuAdjusted: true,
      sikuNote: "SIKU 65 +1",
      skpm: 72,
      final: 77,
      letter: "B",
      passes: true,
      limited: false,
      limitedFrom: null,
    });
  });

  it('keeps a grade "Belum lengkap" with the parts the student has', () => {
    const incomplete = row({
      attendance: { percent: null, attended: 0, counted: 0 },
      skpm: null,
      grade: { complete: false },
    });

    expect(fixedGradeOf(incomplete)).toMatchObject({
      attendance: null,
      mentoring: 80,
      siku: 66,
      skpm: null,
      final: null,
      letter: null,
      passes: null,
    });
  });

  it('keeps "dibatasi 70" with the score before the limit where it lowered Nilai akhir', () => {
    const limited = row({
      grade: {
        complete: true,
        final: 70,
        letter: "B",
        passes: true,
        limitedFrom: 77,
      },
      limited: true,
    });

    expect(fixedGradeOf(limited)).toMatchObject({
      final: 70,
      limited: true,
      limitedFrom: 77,
    });
  });

  it('keeps "dibatasi 70" on a limited grade the limit did not lower', () => {
    const limited = row({ grade: { complete: false }, limited: true });

    expect(fixedGradeOf(limited)).toMatchObject({
      final: null,
      limited: true,
      limitedFrom: null,
    });
  });
});

describe("closingCounts", () => {
  it("counts the students, the complete grades and those Belum lengkap", () => {
    const rows = [row(), row({ grade: { complete: false } }), row()];

    expect(closingCounts(rows)).toEqual({
      students: 3,
      complete: 2,
      incomplete: 1,
    });
  });

  it("counts nothing without a student", () => {
    expect(closingCounts([])).toEqual({
      students: 0,
      complete: 0,
      incomplete: 0,
    });
  });
});
