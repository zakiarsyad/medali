import { describe, expect, it } from "vitest";
import type { Scores } from "./assessment-score";
import { coachingNeedOf, weakestValueOf } from "./coaching-need";
import { COACHING_LEVEL_WORDS } from "./coaching-words";

function scoresOf(
  M: number,
  E: number,
  D: number,
  A: number,
  L: number,
  I: number,
): Scores {
  return { M, E, D, A, L, I };
}

describe("who needs coaching after their latest assessment", () => {
  it("gives Intensif below a Rerata of 60: 55, 58, 60, 57, 59, 61 (58.3)", () => {
    expect(coachingNeedOf(scoresOf(55, 58, 60, 57, 59, 61))).toEqual({
      level: "intensive",
      weakest: "M",
    });
  });

  it("gives Sedang below a Rerata of 65: 62, 60, 64, 58, 61, 63 (61.3)", () => {
    expect(coachingNeedOf(scoresOf(62, 60, 64, 58, 61, 63))).toEqual({
      level: "moderate",
      weakest: "A",
    });
  });

  it("gives Ringan from a Rerata of 65 when one score is below 58: 70, 72, 56, 75, 74, 73 (70.0)", () => {
    expect(coachingNeedOf(scoresOf(70, 72, 56, 75, 74, 73))).toEqual({
      level: "light",
      weakest: "D",
    });
  });

  it("lists nobody with a Rerata of 65 or more and every score 58 or more: 66, 70, 58, 72, 68, 71", () => {
    expect(coachingNeedOf(scoresOf(66, 70, 58, 72, 68, 71))).toBeNull();
  });

  it("puts the edges on the right side: a Rerata of exactly 65 or 60, and a score of exactly 58", () => {
    expect(coachingNeedOf(scoresOf(65, 65, 65, 65, 65, 65))).toBeNull();
    expect(coachingNeedOf(scoresOf(60, 60, 60, 60, 60, 60))?.level).toBe(
      "moderate",
    );
    expect(coachingNeedOf(scoresOf(59, 60, 60, 60, 60, 60))?.level).toBe(
      "intensive",
    );
    expect(coachingNeedOf(scoresOf(57, 80, 80, 80, 80, 80))?.level).toBe(
      "light",
    );
  });

  it("names the Rerata 64.8 Sedang, just under 65", () => {
    expect(coachingNeedOf(scoresOf(64, 65, 65, 65, 65, 65))?.level).toBe(
      "moderate",
    );
  });
});

describe("the weakest value", () => {
  it("is the one with the lowest score", () => {
    expect(weakestValueOf(scoresOf(80, 80, 80, 80, 80, 41))).toBe("I");
  });

  it("is the first in the order of MEDALI when two are equal", () => {
    expect(weakestValueOf(scoresOf(70, 56, 80, 56, 80, 80))).toBe("E");
  });
});

describe("the words of a level", () => {
  it("are Intensif, Sedang and Ringan", () => {
    expect(COACHING_LEVEL_WORDS).toEqual({
      intensive: "Intensif",
      moderate: "Sedang",
      light: "Ringan",
    });
  });
});
