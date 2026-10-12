import { describe, expect, it } from "vitest";
import { academicYear, periodTitle } from "./period-labels";

describe("periodTitle", () => {
  it("names Ganjil and Genap with both years of the Tahun akademik", () => {
    expect(periodTitle({ startYear: 2026, term: "odd" })).toBe(
      "Ganjil 2026/2027",
    );
    expect(periodTitle({ startYear: 2025, term: "even" })).toBe(
      "Genap 2025/2026",
    );
  });
});

describe("academicYear", () => {
  it("writes both years", () => {
    expect(academicYear(2026)).toBe("2026/2027");
  });
});
