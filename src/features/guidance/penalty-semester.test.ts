import { describe, expect, it } from "vitest";
import { semesterOnDay } from "./penalty-semester";

const PERIODS = [
  { startYear: 2026, term: "odd", startsOn: "2026-08-01" },
  { startYear: 2025, term: "even", startsOn: "2026-02-01" },
] as const;

describe("semesterOnDay", () => {
  it("gives the student's semester in the academic period the day falls in", () => {
    expect(semesterOnDay(2025, PERIODS, "2026-10-12")).toBe(3);
    expect(semesterOnDay(2025, PERIODS, "2026-03-01")).toBe(2);
  });

  it("gives none for a day before every period", () => {
    expect(semesterOnDay(2025, PERIODS, "2026-01-31")).toBeNull();
  });
});
