import { describe, expect, it } from "vitest";
import { isDay } from "./is-day";

describe("isDay", () => {
  it("takes a real day written as year-month-day", () => {
    expect(isDay("2026-09-01")).toBe(true);
    expect(isDay("2028-02-29")).toBe(true);
  });

  it.each(["", "1 Sep 2026", "2026-9-1", "2026-02-30", "2026-13-01"])(
    "refuses '%s'",
    (sent) => {
      expect(isDay(sent)).toBe(false);
    },
  );

  it.each(["0000-01-01", "0000-12-31"])(
    "refuses '%s': the database keeps no day of a year zero",
    (sent) => {
      expect(isDay(sent)).toBe(false);
    },
  );

  it("takes the first day of year one, the earliest year the database keeps", () => {
    expect(isDay("0001-01-01")).toBe(true);
  });
});
