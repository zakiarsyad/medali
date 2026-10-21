import { describe, expect, it } from "vitest";
import { countWords, shownCount } from "./shown-count";

describe("shownCount", () => {
  it("shows 0 and 5 or more as they are, and 1 to 4 as <5", () => {
    expect(shownCount(0)).toBe(0);
    for (const count of [1, 2, 3, 4]) expect(shownCount(count)).toBe("<5");
    expect(shownCount(5)).toBe(5);
    expect(shownCount(120)).toBe(120);
  });
});

describe("countWords", () => {
  it("writes a count in Indonesian digits, and <5 as it is", () => {
    expect(countWords(1200)).toBe("1.200");
    expect(countWords("<5")).toBe("<5");
  });
});
