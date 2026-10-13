import { describe, expect, it } from "vitest";
import { countsThisYear, yearDaysOf } from "./replacement-year";

const TODAY = "2026-10-13";

function startingOn(startsOn: string, cancelledAt: Date | null = null) {
  return { startsOn, cancelledAt };
}

describe("yearDaysOf", () => {
  it("gives the first day of the year of a day and of the year after", () => {
    expect(yearDaysOf(TODAY)).toEqual({
      from: "2026-01-01",
      before: "2027-01-01",
    });
    expect(yearDaysOf("2026-12-31").before).toBe("2027-01-01");
    expect(yearDaysOf("2027-01-01").from).toBe("2027-01-01");
  });
});

describe("countsThisYear", () => {
  it("counts a replacement that started this year, from the first day to the last", () => {
    expect(countsThisYear(startingOn("2026-01-01"), TODAY)).toBe(true);
    expect(countsThisYear(startingOn("2026-09-13"), TODAY)).toBe(true);
    expect(countsThisYear(startingOn("2026-12-31"), TODAY)).toBe(true);
  });

  it("counts one that waits for a later day of this year", () => {
    expect(countsThisYear(startingOn("2026-11-02"), TODAY)).toBe(true);
  });

  it("leaves out one of the year before and one of the year after", () => {
    expect(countsThisYear(startingOn("2025-12-31"), TODAY)).toBe(false);
    expect(countsThisYear(startingOn("2027-01-01"), TODAY)).toBe(false);
  });

  it("leaves out one that is cancelled", () => {
    const cancelled = startingOn(
      "2026-11-02",
      new Date("2026-10-13T03:00:00Z"),
    );

    expect(countsThisYear(cancelled, TODAY)).toBe(false);
  });
});
