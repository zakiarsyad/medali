import { describe, expect, it } from "vitest";
import { isWeekday, weekdayFrom } from "./weekdays";

describe("isWeekday", () => {
  it("is true for Senin to Jumat", () => {
    for (const day of ["2026-10-19", "2026-10-21", "2026-10-23"]) {
      expect(isWeekday(day)).toBe(true);
    }
  });

  it("is false for Sabtu and Minggu", () => {
    expect(isWeekday("2026-10-24")).toBe(false);
    expect(isWeekday("2026-10-25")).toBe(false);
  });
});

describe("weekdayFrom", () => {
  it("keeps a day of Senin to Jumat", () => {
    expect(weekdayFrom("2026-10-23")).toBe("2026-10-23");
  });

  it("moves Sabtu and Minggu to the Senin after", () => {
    expect(weekdayFrom("2026-10-24")).toBe("2026-10-26");
    expect(weekdayFrom("2026-10-25")).toBe("2026-10-26");
  });
});
