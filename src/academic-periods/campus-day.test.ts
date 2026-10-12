import { describe, expect, it } from "vitest";
import { campusDay } from "./campus-day";

describe("campusDay", () => {
  it("gives the day as year-month-day", () => {
    expect(campusDay(new Date("2026-10-12T05:00:00Z"))).toBe("2026-10-12");
  });

  it("counts the day in campus time, seven hours ahead of UTC", () => {
    expect(campusDay(new Date("2026-07-31T16:59:59Z"))).toBe("2026-07-31");
    expect(campusDay(new Date("2026-07-31T17:00:00Z"))).toBe("2026-08-01");
  });
});
