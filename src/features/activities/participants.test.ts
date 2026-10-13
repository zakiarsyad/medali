import { describe, expect, it } from "vitest";
import {
  type CohortCount,
  countParticipants,
  isInSemester,
  semestersByPeriod,
} from "./participants";

const ODD_2026 = { startYear: 2026, term: "odd" } as const;
const EVEN_2025 = { startYear: 2025, term: "even" } as const;

const COUNTS: CohortCount[] = [
  { cohortYear: 2026, students: 100 },
  { cohortYear: 2025, students: 90 },
  { cohortYear: 2024, students: 80 },
  { cohortYear: 2022, students: 20 },
  { cohortYear: 2021, students: 3 },
];

describe("isInSemester", () => {
  it("puts an angkatan in the semester its years since the start give", () => {
    expect(isInSemester(2026, 1, ODD_2026)).toBe(true);
    expect(isInSemester(2025, 3, ODD_2026)).toBe(true);
    expect(isInSemester(2025, 2, EVEN_2025)).toBe(true);
  });

  it("puts it in no other semester", () => {
    expect(isInSemester(2025, 1, ODD_2026)).toBe(false);
    expect(isInSemester(2025, 4, ODD_2026)).toBe(false);
  });

  it("puts an angkatan that starts after the period in no semester, not even semester 1", () => {
    expect(isInSemester(2026, 1, EVEN_2025)).toBe(false);
    expect(isInSemester(2026, 2, EVEN_2025)).toBe(false);
    expect(isInSemester(2027, 1, ODD_2026)).toBe(false);
  });

  it("counts an angkatan past semester 8 as semester 8", () => {
    expect(isInSemester(2023, 8, ODD_2026)).toBe(false);
    expect(isInSemester(2022, 8, { startYear: 2025, term: "even" })).toBe(true);
    expect(isInSemester(2021, 8, ODD_2026)).toBe(true);
  });
});

describe("countParticipants", () => {
  it("counts the students of the angkatan in that semester", () => {
    expect(countParticipants(COUNTS, 1, ODD_2026)).toBe(100);
    expect(countParticipants(COUNTS, 3, ODD_2026)).toBe(90);
  });

  it("counts nobody for a semester no angkatan is in", () => {
    expect(countParticipants(COUNTS, 2, ODD_2026)).toBe(0);
  });

  it("leaves out the students who came after the period of the schedule", () => {
    // In Genap 2025/2026 the angkatan 2025 is in semester 2 and the
    // angkatan 2026 is not there yet.
    expect(countParticipants(COUNTS, 2, EVEN_2025)).toBe(90);
    expect(countParticipants(COUNTS, 1, EVEN_2025)).toBe(0);
  });

  it("adds up every angkatan that counts as semester 8", () => {
    const late = { startYear: 2028, term: "even" } as const;

    expect(countParticipants(COUNTS, 8, late)).toBe(90 + 80 + 20 + 3);
  });

  it("counts nobody while no period is known", () => {
    expect(countParticipants(COUNTS, 1, null)).toBe(0);
  });
});

describe("semestersByPeriod", () => {
  const PERIODS = [
    { id: "odd-2026", ...ODD_2026 },
    { id: "even-2025", ...EVEN_2025 },
    { id: "odd-2025", startYear: 2025, term: "odd" },
  ] as const;

  it("gives the semester a student was in during each period", () => {
    expect(semestersByPeriod(2025, PERIODS)).toEqual([
      { periodId: "odd-2026", semester: 3 },
      { periodId: "even-2025", semester: 2 },
      { periodId: "odd-2025", semester: 1 },
    ]);
  });

  it("leaves out the periods before the student's angkatan started", () => {
    expect(semestersByPeriod(2026, PERIODS)).toEqual([
      { periodId: "odd-2026", semester: 1 },
    ]);
    expect(semestersByPeriod(2027, PERIODS)).toEqual([]);
  });
});
