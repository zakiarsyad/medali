import { describe, expect, it } from "vitest";
import {
  levelOf,
  predicateOf,
  rerataFromTotal,
  rerataOf,
  type Scores,
} from "./assessment-score";

function scores(...each: [number, number, number, number, number, number]) {
  const [M, E, D, A, L, I] = each;
  return { M, E, D, A, L, I } satisfies Scores;
}

describe("rerataOf", () => {
  it("is the plain average of the six scores to one decimal", () => {
    expect(rerataOf(scores(80, 78, 84, 72, 82, 86))).toBe(80.3);
    expect(rerataOf(scores(85, 85, 85, 85, 85, 85))).toBe(85);
    expect(rerataOf(scores(40, 40, 40, 40, 40, 41))).toBe(40.2);
    expect(rerataOf(scores(70, 70, 70, 70, 70, 71))).toBe(70.2);
    expect(rerataOf(scores(70, 70, 70, 71, 71, 71))).toBe(70.5);
  });

  it("is worked out the same from the total of the six", () => {
    expect(rerataFromTotal(482)).toBe(80.3);
    expect(rerataFromTotal(509)).toBe(84.8);
  });
});

describe("predicateOf", () => {
  it("gives Perak to 80.3, from scores 80, 78, 84, 72, 82, 86", () => {
    expect(predicateOf(rerataOf(scores(80, 78, 84, 72, 82, 86)))).toBe(
      "silver",
    );
  });

  it("gives Emas to six scores of 85", () => {
    expect(predicateOf(rerataOf(scores(85, 85, 85, 85, 85, 85)))).toBe("gold");
  });

  it("gives Perlu pembinaan to 64.9", () => {
    expect(predicateOf(64.9)).toBe("guidance");
  });

  it("starts each predikat at its lowest score: Emas 85, Perak 75, Perunggu 65", () => {
    expect(predicateOf(100)).toBe("gold");
    expect(predicateOf(85)).toBe("gold");
    expect(predicateOf(84.9)).toBe("silver");
    expect(predicateOf(75)).toBe("silver");
    expect(predicateOf(74.9)).toBe("bronze");
    expect(predicateOf(65)).toBe("bronze");
    expect(predicateOf(40)).toBe("guidance");
  });

  it("never differs between the shown Rerata and the unrounded average of whole scores", () => {
    // 509 / 6 is 84.83…, shown as 84.8: both are below 85.
    expect(predicateOf(rerataFromTotal(509))).toBe(predicateOf(509 / 6));
    for (let total = 240; total <= 600; total += 1) {
      expect(predicateOf(rerataFromTotal(total))).toBe(predicateOf(total / 6));
    }
  });
});

describe("levelOf", () => {
  it("puts a score below 65 in level 1, 65–74 in 2, 75–84 in 3, and 85 and above in 4", () => {
    expect(levelOf(40)).toBe(1);
    expect(levelOf(64)).toBe(1);
    expect(levelOf(65)).toBe(2);
    expect(levelOf(74)).toBe(2);
    expect(levelOf(75)).toBe(3);
    expect(levelOf(84)).toBe(3);
    expect(levelOf(85)).toBe(4);
    expect(levelOf(100)).toBe(4);
  });
});
