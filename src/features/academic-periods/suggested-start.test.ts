import { describe, expect, it } from "vitest";
import { academicYearOn, suggestedStart } from "./suggested-start";

describe("suggestedStart", () => {
  it("suggests 1 August of the first year for Ganjil", () => {
    expect(suggestedStart(2026, "odd")).toBe("2026-08-01");
  });

  it("suggests 1 February of the second year for Genap", () => {
    expect(suggestedStart(2026, "even")).toBe("2027-02-01");
  });
});

describe("academicYearOn", () => {
  it.each([
    ["2026-08-01", 2026],
    ["2026-12-31", 2026],
    ["2027-01-01", 2026],
    ["2027-07-31", 2026],
  ])("puts %s in the Tahun akademik that starts in %i", (day, startYear) => {
    expect(academicYearOn(day)).toBe(startYear);
  });
});
