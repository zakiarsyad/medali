import { describe, expect, it } from "vitest";
import { monthOf } from "./dashboard-month";

describe("monthOf", () => {
  it("spans the campus month of a day, from its first midnight to the next month's", () => {
    expect(monthOf("2026-10-16")).toEqual({
      start: new Date("2026-10-01T00:00:00+07:00"),
      end: new Date("2026-11-01T00:00:00+07:00"),
    });
  });

  it("goes on into the next year after December", () => {
    expect(monthOf("2026-12-31")).toEqual({
      start: new Date("2026-12-01T00:00:00+07:00"),
      end: new Date("2027-01-01T00:00:00+07:00"),
    });
  });
});
