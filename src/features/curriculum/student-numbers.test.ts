import { describe, expect, it } from "vitest";
import {
  type CohortCount,
  semesterCounts,
  studentsIn,
  tahapCount,
} from "./student-numbers";

const ODD_2026 = { startYear: 2026, term: "odd" } as const;
const EVEN_2026 = { startYear: 2026, term: "even" } as const;

const COHORTS: CohortCount[] = [
  { cohortYear: 2026, students: 120 },
  { cohortYear: 2025, students: 110 },
  { cohortYear: 2024, students: 100 },
  { cohortYear: 2023, students: 90 },
];

describe("semesterCounts", () => {
  it("puts each angkatan in its semester of the running period", () => {
    const counts = semesterCounts(COHORTS, ODD_2026);

    expect(studentsIn(counts, 1)).toBe(120);
    expect(studentsIn(counts, 3)).toBe(110);
    expect(studentsIn(counts, 5)).toBe(100);
    expect(studentsIn(counts, 7)).toBe(90);
    expect(studentsIn(counts, 2)).toBe(0);
  });

  it("moves every angkatan on in a semester genap", () => {
    const counts = semesterCounts(COHORTS, EVEN_2026);

    expect(studentsIn(counts, 2)).toBe(120);
    expect(studentsIn(counts, 8)).toBe(90);
    expect(studentsIn(counts, 1)).toBe(0);
  });

  it("adds angkatan that fall in the same semester, as the oldest stay in semester 8", () => {
    const counts = semesterCounts(
      [
        { cohortYear: 2022, students: 5 },
        { cohortYear: 2020, students: 3 },
      ],
      ODD_2026,
    );

    expect(studentsIn(counts, 8)).toBe(8);
  });

  it("gives no student a semester while no period runs", () => {
    const counts = semesterCounts(COHORTS, null);

    for (let semester = 1; semester <= 8; semester++) {
      expect(studentsIn(counts, semester)).toBe(0);
    }
  });
});

describe("tahapCount", () => {
  it("counts each tahap from its semesters", () => {
    const counts = semesterCounts(COHORTS.slice(0, 3), ODD_2026);

    expect([1, 2, 3, 4].map((no) => tahapCount(counts, no))).toEqual([
      120, 110, 100, 0,
    ]);
  });

  it("adds the two semesters of a tahap", () => {
    const counts = semesterCounts(
      [
        { cohortYear: 2023, students: 90 },
        { cohortYear: 2020, students: 4 },
      ],
      ODD_2026,
    );

    expect(tahapCount(counts, 4)).toBe(94);
  });

  it("is 0 for every tahap while no period runs", () => {
    const counts = semesterCounts(COHORTS, null);

    expect([1, 2, 3, 4].map((no) => tahapCount(counts, no))).toEqual([
      0, 0, 0, 0,
    ]);
  });
});
