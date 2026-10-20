import { describe, expect, it } from "vitest";
import { type GradeInput, gradeRowOf } from "./grade-list";
import { gradeNumbersOf, passingPercent } from "./grade-numbers";
import { STARTING_SCHEME } from "./scheme-ids";

function input(
  id: string,
  parts: Partial<Omit<GradeInput, "student" | "attendance">>,
  attendance: number | null = 90,
): GradeInput {
  return {
    student: { id, name: id, nim: id, program: "Prodi Uji" },
    attendance: { percent: attendance, attended: 9, counted: 10 },
    mentoring: 80,
    siku: { score: 66, adjusted: false, note: "SIKU dasar 65" },
    skpm: 72,
    ...parts,
  };
}

const ADJUSTED = { score: 66, adjusted: true, note: "SIKU 65 +1" };

const ROWS = [
  // 90, 80, 66 and 72: 77.0, B, passes.
  input("a", { siku: ADJUSTED }),
  // 60, 70, 64 and 40: 58.5, D, does not pass.
  input("b", { mentoring: 70, siku: { ...ADJUSTED, score: 64 }, skpm: 40 }, 60),
  // Belum lengkap, with a low part that must not pull the mean down.
  input("c", { mentoring: null, skpm: 0 }, 10),
].map((each) => gradeRowOf(each, STARTING_SCHEME));

describe("gradeNumbersOf", () => {
  it("counts the mean and who passes over the worked-out grades only", () => {
    const numbers = gradeNumbersOf(ROWS);

    expect(numbers).toEqual({
      students: 3,
      // (77.0 + 58.5) ÷ 2 = 67.75
      meanFinal: 67.8,
      complete: 2,
      passing: 1,
      adjusted: 2,
      incomplete: 1,
    });
    expect(passingPercent(numbers)).toBe(50);
  });

  it("has no mean and no share while no grade is worked out", () => {
    const numbers = gradeNumbersOf(ROWS.slice(2));

    expect(numbers.meanFinal).toBeNull();
    expect(passingPercent(numbers)).toBeNull();
    expect(numbers.incomplete).toBe(1);
  });
});
