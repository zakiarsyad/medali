import { describe, expect, it } from "vitest";
import { isScore } from "./score-range";

describe("isScore", () => {
  it.each([0, 1, 64, 85, 100])("takes %i", (number) => {
    expect(isScore(number)).toBe(true);
  });

  it.each([-1, 101, 79.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "refuses %d, which is no whole number from 0 to 100",
    (number) => {
      expect(isScore(number)).toBe(false);
    },
  );
});
