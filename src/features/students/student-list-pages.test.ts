import { describe, expect, it } from "vitest";
import {
  PAGE_SIZE,
  pageCount,
  pageWithin,
  rowRange,
} from "./student-list-pages";

describe("the pages of the list", () => {
  it("hold 25 students each", () => {
    expect(PAGE_SIZE).toBe(25);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(25)).toBe(1);
    expect(pageCount(26)).toBe(2);
    expect(pageCount(62)).toBe(3);
  });

  it("keep a page that exists, and go to the last one for a page past it", () => {
    expect(pageWithin(2, 62)).toBe(2);
    expect(pageWithin(3, 62)).toBe(3);
    expect(pageWithin(4, 62)).toBe(3);
    expect(pageWithin(9, 0)).toBe(1);
  });

  it("say which rows a page shows", () => {
    expect(rowRange(1, 62)).toEqual({ first: 1, last: 25 });
    expect(rowRange(2, 62)).toEqual({ first: 26, last: 50 });
    expect(rowRange(3, 62)).toEqual({ first: 51, last: 62 });
    expect(rowRange(1, 7)).toEqual({ first: 1, last: 7 });
  });
});
