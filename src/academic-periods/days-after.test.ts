import { describe, expect, it } from "vitest";
import { daysAfter } from "./days-after";

describe("daysAfter", () => {
  it("gives the same day for no days", () => {
    expect(daysAfter("2026-10-13", 0)).toBe("2026-10-13");
  });

  it("goes on over the end of a month and of a year", () => {
    expect(daysAfter("2026-10-31", 1)).toBe("2026-11-01");
    expect(daysAfter("2026-12-25", 7)).toBe("2027-01-01");
  });

  it("counts the extra day of a leap year", () => {
    expect(daysAfter("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysAfter("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("goes on 52 weeks", () => {
    expect(daysAfter("2026-10-13", 364)).toBe("2027-10-12");
  });
});
