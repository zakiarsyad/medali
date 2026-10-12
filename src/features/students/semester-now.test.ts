import { describe, expect, it } from "vitest";
import { semesterNow } from "./semester-now";

const ODD_2026 = { startYear: 2026, term: "odd" } as const;

describe("semesterNow", () => {
  it("gives an Aktif student the semester of the running period", () => {
    const student = { cohortYear: 2025, status: "active" } as const;

    expect(semesterNow(student, ODD_2026)).toBe(3);
  });

  it("gives a Cuti student a semester too", () => {
    const student = { cohortYear: 2026, status: "on_leave" } as const;

    expect(semesterNow(student, ODD_2026)).toBe(1);
  });

  it("gives a Non aktif student none", () => {
    const student = { cohortYear: 2025, status: "inactive" } as const;

    expect(semesterNow(student, ODD_2026)).toBeNull();
  });

  it("gives nobody a semester while no period runs", () => {
    const student = { cohortYear: 2025, status: "active" } as const;

    expect(semesterNow(student, null)).toBeNull();
  });
});
