import { describe, expect, it } from "vitest";
import { gradeNumbersFrom, passingPercent } from "./grade-numbers";

describe("gradeNumbersFrom", () => {
  it("counts the mean and who passes over the worked-out grades only", () => {
    const numbers = gradeNumbersFrom({
      students: 3,
      complete: 2,
      passing: 1,
      adjusted: 2,
      // 77.0 and 58.5; the third is Belum lengkap.
      finalSum: 135.5,
    });

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
    const numbers = gradeNumbersFrom({
      students: 1,
      complete: 0,
      passing: 0,
      adjusted: 0,
      finalSum: null,
    });

    expect(numbers.meanFinal).toBeNull();
    expect(passingPercent(numbers)).toBeNull();
    expect(numbers.incomplete).toBe(1);
  });
});
