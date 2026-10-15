import { describe, expect, it } from "vitest";
import { letterOf, passes, weightTotal } from "./grade-letter";
import { type GradeScheme, STARTING_SCHEME } from "./scheme-ids";

describe("letterOf", () => {
  it.each([
    [100, "A"],
    [85, "A"],
    [84.9, "B"],
    [70, "B"],
    [69.9, "C"],
    [60, "C"],
    [50, "D"],
    [49.9, "E"],
    [0, "E"],
  ])("gives %s the letter %s with the starting scheme", (score, letter) => {
    expect(letterOf(score, STARTING_SCHEME)).toBe(letter);
  });

  it("follows the limits of the scheme in force", () => {
    const scheme: GradeScheme = {
      ...STARTING_SCHEME,
      lowerLimits: { A: 90, B: 80, C: 70, D: 0 },
    };

    expect(letterOf(85, scheme)).toBe("B");
    expect(letterOf(0, scheme)).toBe("D");
  });
});

describe("passes", () => {
  it.each([
    ["A", true],
    ["B", true],
    ["C", false],
    ["D", false],
    ["E", false],
  ] as const)("with pass letter B, %s passes: %s", (letter, passed) => {
    expect(passes(letter, "B")).toBe(passed);
  });

  it("lets every letter pass with pass letter E, and only A with pass letter A", () => {
    expect(passes("E", "E")).toBe(true);
    expect(passes("A", "A")).toBe(true);
    expect(passes("B", "A")).toBe(false);
  });
});

describe("weightTotal", () => {
  it("adds the four weights", () => {
    expect(weightTotal(STARTING_SCHEME.weights)).toBe(100);
    expect(
      weightTotal({ attendance: 40, mentoring: 20, siku: 0, skpm: 20 }),
    ).toBe(80);
  });
});
