import { describe, expect, it } from "vitest";
import { fixedRowOf } from "./fixed-grade-rows";
import { fixedGradeOf } from "./fixed-grades";
import type { GradeRow } from "./grade-list";

const STUDENT = {
  id: "id-ani",
  name: "Ani Uji Tetap",
  nim: "9987100401",
  program: "Prodi Uji",
};

const COMPLETE: GradeRow = {
  student: STUDENT,
  attendance: { percent: 87.5, attended: 7, counted: 8 },
  mentoring: 80,
  siku: { score: 68, adjusted: true, note: "SIKU 65 +5 / −2" },
  skpm: 72,
  grade: { complete: true, final: 76.9, letter: "B", passes: true },
  limited: false,
};

/** The row as the closing kept it, read back with its student's names. */
function keptAndRead(row: GradeRow): GradeRow {
  const { studentId, ...kept } = fixedGradeOf(row);
  return fixedRowOf({
    studentId,
    name: STUDENT.name,
    nim: STUDENT.nim,
    program: STUDENT.program,
    attendance: kept.attendance ?? null,
    attended: kept.attended,
    counted: kept.counted,
    mentoring: kept.mentoring ?? null,
    siku: kept.siku,
    sikuAdjusted: kept.sikuAdjusted,
    sikuNote: kept.sikuNote,
    skpm: kept.skpm ?? null,
    final: kept.final ?? null,
    letter: kept.letter ?? null,
    passes: kept.passes ?? null,
    limited: kept.limited,
    limitedFrom: kept.limitedFrom ?? null,
  });
}

describe("fixedRowOf", () => {
  it("gives back the row a closing kept, every part as it was shown", () => {
    expect(keptAndRead(COMPLETE)).toEqual(COMPLETE);
  });

  it("gives back a grade held at 70, with the score before the limit", () => {
    const limited: GradeRow = {
      ...COMPLETE,
      grade: {
        complete: true,
        final: 70,
        letter: "B",
        passes: true,
        limitedFrom: 88.9,
      },
      limited: true,
    };

    expect(keptAndRead(limited)).toEqual(limited);
  });

  it("gives back a Belum lengkap grade with the parts the student had, also when it is limited", () => {
    const incomplete: GradeRow = {
      ...COMPLETE,
      attendance: { percent: null, attended: 0, counted: 0 },
      mentoring: null,
      grade: { complete: false },
      limited: true,
    };

    expect(keptAndRead(incomplete)).toEqual(incomplete);
  });
});
