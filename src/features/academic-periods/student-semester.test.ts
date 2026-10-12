import { describe, expect, it } from "vitest";
import { studentSemester } from "./student-semester";

const ODD_2026 = { startYear: 2026, term: "odd" } as const;
const EVEN_2026 = { startYear: 2026, term: "even" } as const;

describe("studentSemester", () => {
  it.each([
    [2026, 1],
    [2025, 3],
    [2024, 5],
    [2023, 7],
  ])(
    "puts angkatan %i in semester %i in Ganjil 2026/2027",
    (cohort, semester) => {
      expect(studentSemester(cohort, ODD_2026)).toBe(semester);
    },
  );

  it.each([
    [2026, 2],
    [2025, 4],
    [2023, 8],
  ])(
    "puts angkatan %i in semester %i in Genap 2026/2027",
    (cohort, semester) => {
      expect(studentSemester(cohort, EVEN_2026)).toBe(semester);
    },
  );

  it("never goes above semester 8", () => {
    expect(studentSemester(2022, ODD_2026)).toBe(8);
    expect(studentSemester(2022, EVEN_2026)).toBe(8);
    expect(studentSemester(2015, ODD_2026)).toBe(8);
  });

  it("never goes below semester 1", () => {
    expect(studentSemester(2027, ODD_2026)).toBe(1);
    expect(studentSemester(2027, EVEN_2026)).toBe(1);
    expect(studentSemester(2030, ODD_2026)).toBe(1);
  });
});
