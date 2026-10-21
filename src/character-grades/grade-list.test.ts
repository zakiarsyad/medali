import { describe, expect, it } from "vitest";
import { type GradeInput, gradeRowOf } from "./grade-list";
import { STARTING_SCHEME } from "./scheme-ids";

function input(
  nim: string,
  name: string,
  more: Partial<GradeInput> = {},
): GradeInput {
  return {
    student: { id: `id-${nim}`, name, nim, program: "Prodi Uji" },
    attendance: { percent: 90, attended: 9, counted: 10 },
    mentoring: 80,
    siku: { score: 66, adjusted: true, note: "SIKU 65 +1" },
    skpm: 72,
    ...more,
  };
}

const NO_ATTENDANCE = { percent: null, attended: 0, counted: 0 };

const ROWS = [
  input("9987100101", "Ani Lulus"),
  input("9987100102", "Budi Gagal", { skpm: 0 }),
  input("9987100103", "Citra Kosong", { attendance: NO_ATTENDANCE }),
  input("9987100104", "Dodi Tanpa Pengasuh", { mentoring: null }),
].map((each) => gradeRowOf(each, STARTING_SCHEME));

describe("gradeRowOf", () => {
  it("gives the grade of the student's four parts", () => {
    expect(ROWS[0]?.grade).toEqual({
      complete: true,
      final: 77,
      letter: "B",
      passes: true,
    });
    expect(ROWS[2]?.grade).toEqual({ complete: false });
    expect(ROWS[0]?.limited).toBe(false);
  });

  it("holds the grade of a student under a Ringan or Sedang penalty at 70, marking the row", () => {
    const row = gradeRowOf(
      input("9987100105", "Eko Dibatasi", { skpm: 100 }),
      STARTING_SCHEME,
      true,
    );

    expect(row.limited).toBe(true);
    expect(row.grade).toEqual({
      complete: true,
      final: 70,
      letter: "B",
      passes: true,
      limitedFrom: 84,
    });
  });
});
