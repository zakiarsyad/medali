import { describe, expect, it } from "vitest";
import {
  countWords,
  hiddenArePinned,
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

  it("hides one more while two <5 add up to the fewest they could, 1 each", () => {
    expect(shownSet(ORDER, { a: 1, b: 1, c: 10, d: 12 })).toEqual({
      a: "<5",
      b: "<5",
      c: "5+",
      d: 12,
    });
  });

  it("hides one more while two <5 add up to the most they could, 4 each", () => {
    expect(shownSet(ORDER, { a: 4, b: 4, c: 10, d: 12 })).toEqual({
      a: "<5",
      b: "<5",
      c: "5+",
      d: 12,
    });
  });

  it("hides nothing more while two <5 could add up to their sum in more than one way", () => {
    expect(shownSet(ORDER, { a: 1, b: 3, c: 10, d: 0 })).toEqual({
      a: "<5",
      b: "<5",
      c: 10,
      d: 0,
    });
  });

  it("hides the largest too while a <5 and a 5+ add up to the fewest they could, 1 and 5", () => {
    expect(shownSet(ORDER, { a: 20, b: 0, c: 1, d: 5 })).toEqual({
      a: "5+",
      b: 0,
      c: "<5",
      d: "5+",
    });
  });
});

describe("hiddenArePinned", () => {
  it("says the hidden counts are pinned while exactly one is hidden", () => {
    const set = [
      { key: "a", count: 9, hidden: true },
      { key: "b", count: 6, hidden: false },
    ];
    expect(hiddenArePinned(set, 15)).toBe(true);
  });

  it("says they are pinned at the fewest, 1 per <5 and 5 per 5+", () => {
    const set = [
      { key: "a", count: 1, hidden: true },
      { key: "b", count: 5, hidden: true },
      { key: "c", count: 20, hidden: false },
    ];
    expect(hiddenArePinned(set, 26)).toBe(true);
  });

  it("says they are pinned at the most while all are <5, 4 each", () => {
    const set = [
      { key: "a", count: 4, hidden: true },
      { key: "b", count: 4, hidden: true },
      { key: "c", count: 10, hidden: false },
    ];
    expect(hiddenArePinned(set, 18)).toBe(true);
  });

  it("says they are not pinned while none is hidden, or their sum fits more than one way", () => {
    const shown = [{ key: "a", count: 6, hidden: false }];
    const loose = [
      { key: "a", count: 1, hidden: true },
      { key: "b", count: 3, hidden: true },
      { key: "c", count: 10, hidden: false },
    ];
    expect(hiddenArePinned(shown, 6)).toBe(false);
    expect(hiddenArePinned(loose, 14)).toBe(false);
  });
});

describe("oneMoreToHide", () => {
  it("names the smallest count above 0 still shown while exactly one is hidden, the first on a tie", () => {
    expect(
      oneMoreToHide(
        [
          { key: "a", count: 9, hidden: true },
          { key: "b", count: 0, hidden: false },
          { key: "c", count: 6, hidden: false },
          { key: "d", count: 6, hidden: false },
        ],
        21,
      ),
    ).toBe("c");
  });

  it("names none while no count is hidden, or two hidden are not pinned", () => {
    const shown = { count: 6, hidden: false };
    const hidden = { count: 6, hidden: true };
    expect(oneMoreToHide([{ key: "a", ...shown }], 6)).toBeNull();
    expect(
      oneMoreToHide(
        [
          { key: "a", ...hidden },
          { key: "b", ...hidden },
          { key: "c", ...shown },
        ],
        18,
      ),
    ).toBeNull();
  });
});
