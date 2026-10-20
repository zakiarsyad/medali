import { describe, expect, it } from "vitest";
import { finalScoreOf, gradeOf, skpmPartOf } from "./character-grade";
import { STARTING_SCHEME } from "./scheme-ids";
import { FORTY_TWENTY } from "./test-scheme";

const GOOD = { attendance: 90, mentoring: 80, siku: 66, skpm: 72 };
const LOW = { attendance: 60, mentoring: 70, siku: 64, skpm: 40 };

describe("gradeOf", () => {
  it("gives 77.0, B, passing, for 90, 80, 66 and 72 with 25% each", () => {
    expect(gradeOf(GOOD, STARTING_SCHEME)).toEqual({
      complete: true,
      final: 77,
      letter: "B",
      passes: true,
    });
  });

  it("gives 58.5, D, not passing, for 60, 70, 64 and 40 with 25% each", () => {
    expect(gradeOf(LOW, STARTING_SCHEME)).toEqual({
      complete: true,
      final: 58.5,
      letter: "D",
      passes: false,
    });
  });

  it("gives 79.6 for 90, 80, 66 and 72 with the weights 40, 20, 20 and 20", () => {
    const scheme = { ...STARTING_SCHEME, weights: FORTY_TWENTY };

    expect(gradeOf(GOOD, scheme)).toMatchObject({ final: 79.6, letter: "B" });
  });

  it("takes the pass letter of the scheme", () => {
    const scheme = { ...STARTING_SCHEME, passLetter: "D" as const };

    expect(gradeOf(LOW, scheme)).toMatchObject({ letter: "D", passes: true });
  });

  it("says Belum lengkap for any part that is missing, filling nothing", () => {
    for (const part of ["attendance", "mentoring", "siku", "skpm"] as const) {
      const scores = { ...GOOD, [part]: null };

      expect(gradeOf(scores, STARTING_SCHEME)).toEqual({ complete: false });
    }
  });

  it("counts a part of 0 that is there, as it is not missing", () => {
    expect(gradeOf({ ...GOOD, skpm: 0 }, STARTING_SCHEME)).toMatchObject({
      complete: true,
      final: 59,
    });
  });
});

describe("finalScoreOf", () => {
  it("rounds to one decimal", () => {
    const scores = { attendance: 87.5, mentoring: 81, siku: 65, skpm: 33.3 };

    // 21.875 + 20.25 + 16.25 + 8.325 = 66.7
    expect(finalScoreOf(scores, STARTING_SCHEME.weights)).toBe(66.7);
  });
});

describe("skpmPartOf", () => {
  it("is missing while no SKPM upload counts", () => {
    expect(skpmPartOf(undefined, 0)).toBeNull();
  });

  it("is 0 for a student with no rows once an upload counts", () => {
    expect(skpmPartOf(undefined, 1)).toBe(0);
  });

  it("is the student's Nilai SKPM otherwise", () => {
    expect(skpmPartOf(62.5, 2)).toBe(62.5);
  });
});
