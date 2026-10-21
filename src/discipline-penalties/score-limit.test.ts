import { describe, expect, it } from "vitest";
import {
  predicateOf,
  rerataOf,
  type Scores,
} from "@/character-scores/assessment-score";
import {
  CHARACTER_SCORE_CAP,
  limitedScore,
  limitedScores,
  limitOf,
} from "./score-limit";

const SILVER: Scores = { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 };

describe("limitOf", () => {
  it("limits a student with a Ringan or a Sedang penalty, giving the highest of them", () => {
    expect(limitOf([{ category: "light", level: 1 }])).toEqual({
      category: "light",
      level: 1,
    });
    expect(
      limitOf([
        { category: "light", level: 3 },
        { category: "medium", level: 2 },
        { category: "medium", level: 1 },
      ]),
    ).toEqual({ category: "medium", level: 2 });
  });

  it("does not limit for a Berat penalty, nor for none", () => {
    expect(limitOf([])).toBeNull();
    expect(limitOf([{ category: "heavy", level: 1 }])).toBeNull();
    expect(
      limitOf([
        { category: "heavy", level: 3 },
        { category: "light", level: 2 },
      ]),
    ).toEqual({ category: "light", level: 2 });
  });
});

describe("the limited scores", () => {
  it("hold each MEDALI score at 70, so 80, 78, 84, 72, 82, 86 give Rerata 70.0 instead of 80.3", () => {
    expect(CHARACTER_SCORE_CAP).toBe(70);
    expect(rerataOf(SILVER)).toBe(80.3);
    const limited = limitedScores(SILVER, true);
    expect(limited).toEqual({ M: 70, E: 70, D: 70, A: 70, L: 70, I: 70 });
    expect(rerataOf(limited)).toBe(70);
    expect(predicateOf(rerataOf(limited))).toBe("bronze");
  });

  it("keep a score of 70 or below as it is, and every score of a student not limited", () => {
    const low: Scores = { M: 70, E: 55, D: 84, A: 40, L: 71, I: 69 };
    expect(limitedScores(low, true)).toEqual({
      M: 70,
      E: 55,
      D: 70,
      A: 40,
      L: 70,
      I: 69,
    });
    expect(limitedScores(SILVER, false)).toEqual(SILVER);
  });

  it("hold a final nilai karakter of 82.4 at 70.0, and keep one below it", () => {
    expect(limitedScore(82.4, true)).toBe(70);
    expect(limitedScore(65.5, true)).toBe(65.5);
    expect(limitedScore(82.4, false)).toBe(82.4);
  });
});
