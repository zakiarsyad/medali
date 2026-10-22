import { describe, expect, it } from "vitest";
import { mentalRecapOf } from "./mental-recap";

const NONE = {
  normal: 0,
  mild: 0,
  moderate: 0,
  severe: 0,
  extremely_severe: 0,
};

describe("mentalRecapOf", () => {
  it("gives the number assessed and each level from 5 students, a level of 1 to 4 only as <5", () => {
    const recap = mentalRecapOf({
      assessed: 12,
      byLevel: {
        normal: 6,
        mild: 1,
        moderate: 4,
        severe: 0,
        extremely_severe: 1,
      },
    });

    expect(recap).toEqual({
      kind: "shown",
      assessed: 12,
      byLevel: {
        normal: 6,
        mild: "<5",
        moderate: "<5",
        severe: 0,
        extremely_severe: "<5",
      },
    });
  });

  it("gives no number for 1 to 4 assessed, and tells none apart", () => {
    for (const assessed of [1, 4]) {
      expect(
        mentalRecapOf({ assessed, byLevel: { ...NONE, normal: assessed } }),
      ).toEqual({ kind: "too_few" });
    }
    expect(mentalRecapOf({ assessed: 0, byLevel: NONE })).toEqual({
      kind: "none",
    });
  });
});
