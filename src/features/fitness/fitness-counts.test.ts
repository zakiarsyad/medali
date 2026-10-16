import { describe, expect, it } from "vitest";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import { countFitness } from "./fitness-counts";

describe("countFitness", () => {
  it("counts the students by the category of their latest score, and those not tested", () => {
    const numbers = countFitness(
      [
        { students: 2, latest: { score: 90, thisYear: true }, note: null },
        { students: 1, latest: { score: 72, thisYear: false }, note: null },
        { students: 1, latest: { score: 60, thisYear: true }, note: null },
        { students: 3, latest: { score: 40, thisYear: true }, note: null },
        { students: 4, latest: null, note: null },
      ],
      STARTING_LIMITS,
    );

    expect(numbers).toEqual({
      students: 11,
      testedThisYear: 6,
      meanScore: 61.7,
      byCategory: { excellent: 2, good: 1, attention: 1, medical: 3 },
      untested: 4,
    });
  });

  it("keeps the category of a test of last year, but counts it in Sudah dites only for this year", () => {
    const numbers = countFitness(
      [{ students: 1, latest: { score: 88, thisYear: false }, note: null }],
      STARTING_LIMITS,
    );

    expect(numbers.testedThisYear).toBe(0);
    expect(numbers.byCategory.excellent).toBe(1);
    expect(numbers.untested).toBe(0);
  });

  it("works every category out again with the limits in force: with Baik from 75, 72 is Perlu perhatian", () => {
    const numbers = countFitness(
      [{ students: 1, latest: { score: 72, thisYear: true }, note: null }],
      { ...STARTING_LIMITS, goodFrom: 75 },
    );

    expect(numbers.byCategory).toEqual({
      excellent: 0,
      good: 0,
      attention: 1,
      medical: 0,
    });
  });

  it("counts each student in their final category, the more serious of the test and the latest note", () => {
    const numbers = countFitness(
      [
        {
          students: 1,
          latest: { score: 88, thisYear: true },
          note: "attention",
        },
        { students: 1, latest: { score: 50, thisYear: true }, note: "good" },
        { students: 1, latest: null, note: "attention" },
        { students: 1, latest: null, note: null },
      ],
      STARTING_LIMITS,
    );

    expect(numbers.byCategory).toEqual({
      excellent: 0,
      good: 0,
      attention: 2,
      medical: 1,
    });
    expect(numbers.meanScore).toBe(69);
    expect(numbers.untested).toBe(2);
  });

  it("gives no Rerata skor while nobody is tested", () => {
    const numbers = countFitness(
      [{ students: 5, latest: null, note: null }],
      STARTING_LIMITS,
    );

    expect(numbers.meanScore).toBeNull();
    expect(numbers.untested).toBe(5);
  });

  it("gives nothing for no students", () => {
    expect(countFitness([], STARTING_LIMITS)).toEqual({
      students: 0,
      testedThisYear: 0,
      meanScore: null,
      byCategory: { excellent: 0, good: 0, attention: 0, medical: 0 },
      untested: 0,
    });
  });
});
