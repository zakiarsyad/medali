import { describe, expect, it } from "vitest";
import {
  countWords,
  hiddenCount,
  oneMoreToHide,
  shownCount,
  shownSet,
} from "./shown-count";

describe("shownCount", () => {
  it("shows 0 and 5 or more as they are, and 1 to 4 as <5", () => {
    expect(shownCount(0)).toBe(0);
    for (const count of [1, 2, 3, 4]) expect(shownCount(count)).toBe("<5");
    expect(shownCount(5)).toBe(5);
    expect(shownCount(120)).toBe(120);
  });
});

describe("countWords", () => {
  it("writes a count in Indonesian digits, and <5 and 5+ as they are", () => {
    expect(countWords(1200)).toBe("1.200");
    expect(countWords("<5")).toBe("<5");
    expect(countWords("5+")).toBe("5+");
  });
});

describe("hiddenCount", () => {
  it("hides 1 to 4 as <5 and 5 or more as 5+", () => {
    expect(hiddenCount(4)).toBe("<5");
    expect(hiddenCount(5)).toBe("5+");
    expect(hiddenCount(120)).toBe("5+");
  });
});

const ORDER = ["a", "b", "c", "d"] as const;

describe("shownSet", () => {
  it("hides the smallest other count above 0 as 5+ when only one count is <5, so the total gives neither back", () => {
    expect(shownSet(ORDER, { a: 20, b: 0, c: 4, d: 6 })).toEqual({
      a: 20,
      b: 0,
      c: "<5",
      d: "5+",
    });
  });

  it("hides the only other count above 0 too", () => {
    expect(shownSet(ORDER, { a: 9, b: 2, c: 0, d: 0 })).toEqual({
      a: "5+",
      b: "<5",
      c: 0,
      d: 0,
    });
  });

  it("hides the first in order of two smallest that tie", () => {
    expect(shownSet(ORDER, { a: 7, b: 1, c: 7, d: 12 })).toEqual({
      a: "5+",
      b: "<5",
      c: 7,
      d: 12,
    });
  });

  it("hides nothing more when two or more counts are <5, or none is", () => {
    expect(shownSet(ORDER, { a: 7, b: 1, c: 3, d: 12 })).toEqual({
      a: 7,
      b: "<5",
      c: "<5",
      d: 12,
    });
    expect(shownSet(ORDER, { a: 7, b: 0, c: 5, d: 12 })).toEqual({
      a: 7,
      b: 0,
      c: 5,
      d: 12,
    });
  });

  it("leaves the one <5 alone when every other count is 0", () => {
    expect(shownSet(ORDER, { a: 0, b: 3, c: 0, d: 0 })).toEqual({
      a: 0,
      b: "<5",
      c: 0,
      d: 0,
    });
  });
});

describe("oneMoreToHide", () => {
  it("names the smallest count above 0 still shown while exactly one is hidden, the first on a tie", () => {
    expect(
      oneMoreToHide([
        { key: "a", count: 9, hidden: true },
        { key: "b", count: 0, hidden: false },
        { key: "c", count: 6, hidden: false },
        { key: "d", count: 6, hidden: false },
      ]),
    ).toBe("c");
  });

  it("names none while no count or two counts are hidden", () => {
    const shown = { count: 6, hidden: false };
    const hidden = { count: 6, hidden: true };
    expect(oneMoreToHide([{ key: "a", ...shown }])).toBeNull();
    expect(
      oneMoreToHide([
        { key: "a", ...hidden },
        { key: "b", ...hidden },
        { key: "c", ...shown },
      ]),
    ).toBeNull();
  });
});
