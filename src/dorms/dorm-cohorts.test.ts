import { describe, expect, it } from "vitest";
import { dormCohortsOf } from "./dorm-cohorts";

describe("dormCohortsOf", () => {
  it("keeps the angkatan in semester 1 or 2 of the period", () => {
    const years = [2027, 2026, 2025, 2023];

    expect(dormCohortsOf(years, { startYear: 2026, term: "odd" })).toEqual([
      2027, 2026,
    ]);
    expect(dormCohortsOf(years, { startYear: 2026, term: "even" })).toEqual([
      2027, 2026,
    ]);
    expect(dormCohortsOf(years, { startYear: 2027, term: "odd" })).toEqual([
      2027,
    ]);
  });

  it("gives none while no academic period runs", () => {
    expect(dormCohortsOf([2026, 2025], null)).toEqual([]);
  });
});
