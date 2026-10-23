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

  it("sends the smallest other level above 0 as 5+ while only one level is <5, the first on a tie", () => {
    const recap = mentalRecapOf({
      assessed: 40,
      byLevel: {
        normal: 20,
        mild: 9,
        moderate: 2,
        severe: 9,
        extremely_severe: 0,
      },
    });

    expect(recap).toEqual({
      kind: "shown",
      assessed: 40,
      byLevel: {
        normal: 20,
        mild: "5+",
        moderate: "<5",
        severe: 9,
        extremely_severe: 0,
      },
    });
  });

  it("hides one more level while a level of 1 and one of 5 add up to the fewest they could", () => {
    const recap = mentalRecapOf({
      assessed: 26,
      byLevel: {
        normal: 20,
        mild: 5,
        moderate: 1,
        severe: 0,
        extremely_severe: 0,
      },
    });

    expect(recap).toMatchObject({
      byLevel: {
        normal: "5+",
        mild: "5+",
        moderate: "<5",
        severe: 0,
        extremely_severe: 0,
      },
    });
  });

  it("gives every level as it is while none is 1 to 4", () => {
    const byLevel = {
      normal: 20,
      mild: 9,
      moderate: 5,
      severe: 0,
      extremely_severe: 0,
    };

    expect(mentalRecapOf({ assessed: 34, byLevel })).toEqual({
      kind: "shown",
      assessed: 34,
      byLevel,
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
