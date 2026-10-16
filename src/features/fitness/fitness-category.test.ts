import { describe, expect, it } from "vitest";
import { categoryOf, categoryRange } from "./fitness-category";
import { type FitnessLimits, STARTING_LIMITS } from "./fitness-ids";

describe("categoryOf", () => {
  it.each([
    [100, "excellent"],
    [85, "excellent"],
    [84, "good"],
    [70, "good"],
    [69, "attention"],
    [55, "attention"],
    [54, "medical"],
    [0, "medical"],
  ] as const)("puts %i in %s with the starting limits", (score, category) => {
    expect(categoryOf(score, STARTING_LIMITS)).toBe(category);
  });

  it("works a score out again with new limits: with Baik from 75, 72 is Perlu perhatian", () => {
    const limits: FitnessLimits = { ...STARTING_LIMITS, goodFrom: 75 };

    expect(categoryOf(72, STARTING_LIMITS)).toBe("good");
    expect(categoryOf(72, limits)).toBe("attention");
  });
});

describe("categoryRange", () => {
  it("gives the scores of each category with the starting limits", () => {
    expect(categoryRange("excellent", STARTING_LIMITS)).toEqual({
      lowest: 85,
      highest: 100,
    });
    expect(categoryRange("good", STARTING_LIMITS)).toEqual({
      lowest: 70,
      highest: 84,
    });
    expect(categoryRange("attention", STARTING_LIMITS)).toEqual({
      lowest: 55,
      highest: 69,
    });
    expect(categoryRange("medical", STARTING_LIMITS)).toEqual({
      lowest: 0,
      highest: 54,
    });
  });

  it("follows the limits in force", () => {
    const limits = { excellentFrom: 90, goodFrom: 75, attentionFrom: 60 };

    expect(categoryRange("good", limits)).toEqual({ lowest: 75, highest: 89 });
    expect(categoryRange("medical", limits)).toEqual({
      lowest: 0,
      highest: 59,
    });
  });

  it("holds every score in the range of the category it is put in", () => {
    for (let score = 0; score <= 100; score += 1) {
      const range = categoryRange(
        categoryOf(score, STARTING_LIMITS),
        STARTING_LIMITS,
      );
      expect(score).toBeGreaterThanOrEqual(range.lowest);
      expect(score).toBeLessThanOrEqual(range.highest);
    }
  });
});
