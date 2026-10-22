import { describe, expect, it } from "vitest";
import { mentalRecapOf } from "./mental-recap";

describe("mentalRecapOf", () => {
  it("gives the number assessed from 5 students", () => {
    expect(mentalRecapOf({ assessed: 5 })).toEqual({
      kind: "shown",
      assessed: 5,
    });
  });

  it("gives no number for 1 to 4 assessed, and tells none apart", () => {
    for (const assessed of [1, 4]) {
      expect(mentalRecapOf({ assessed })).toEqual({ kind: "too_few" });
    }
    expect(mentalRecapOf({ assessed: 0 })).toEqual({ kind: "none" });
  });
});
