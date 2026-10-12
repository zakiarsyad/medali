import { describe, expect, it } from "vitest";
import { academicYear, periodTitle, shownDay } from "./period-labels";

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

describe("shownDay", () => {
  it("shows a stored day the way the screens write a day", () => {
    expect(shownDay("2026-08-01")).toBe("1 Agu 2026");
    expect(shownDay("2027-01-31")).toBe("31 Jan 2027");
  });
});
