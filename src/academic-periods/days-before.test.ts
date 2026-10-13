import { describe, expect, it } from "vitest";
import { daysBefore } from "./days-before";

describe("daysBefore", () => {
  it("gives the same day for no days", () => {
    expect(daysBefore("2026-10-13", 0)).toBe("2026-10-13");
  });

  it("goes back over the start of a month and of a year", () => {
    expect(daysBefore("2026-10-13", 13)).toBe("2026-09-30");
    expect(daysBefore("2026-01-01", 1)).toBe("2025-12-31");
  });

  it("goes back 90 days", () => {
    expect(daysBefore("2026-10-13", 90)).toBe("2026-07-15");
  });
});
