import { describe, expect, it } from "vitest";
import {
  type AssignmentFacts,
  chosenCohort,
  cohortRows,
  type ListedCohort,
} from "./cohort-rows";

function facts(more: Partial<AssignmentFacts>): AssignmentFacts {
  return { cohortYear: 2026, status: "draft", groups: 2, members: 60, ...more };
}

describe("cohortRows", () => {
  it("lists an angkatan with waiting students and no penetapan as not formed", () => {
    const rows = cohortRows([{ cohortYear: 2026, students: 68 }], [], false);

    expect(rows).toEqual([
      { cohortYear: 2026, students: 68, status: null, isNewest: true },
    ]);
  });

  it("leaves out an angkatan where nobody waits and nothing is prepared", () => {
    const rows = cohortRows([{ cohortYear: 2025, students: 0 }], [], false);

    expect(rows).toEqual([]);
  });

  it("lists the newest angkatan first and marks only that one", () => {
    const rows = cohortRows(
      [
        { cohortYear: 2025, students: 3 },
        { cohortYear: 2026, students: 68 },
      ],
      [facts({ cohortYear: 2024, status: "fixed" })],
      false,
    );

    expect(rows.map((row) => row.cohortYear)).toEqual([2026, 2025, 2024]);
    expect(rows.map((row) => row.isNewest)).toEqual([true, false, false]);
  });

  it("counts for a penetapan that is not fixed the students who wait", () => {
    const rows = cohortRows(
      [{ cohortYear: 2026, students: 70 }],
      [facts({ status: "submitted" })],
      false,
    );

    expect(rows[0]).toMatchObject({ students: 70, status: "submitted" });
  });

  it("counts for a fixed penetapan the members of its groups", () => {
    const rows = cohortRows(
      [{ cohortYear: 2026, students: 2 }],
      [facts({ status: "fixed", members: 60 })],
      false,
    );

    expect(rows[0]).toMatchObject({ students: 60, status: "fixed" });
  });

  it("lists a penetapan once, however many students still wait", () => {
    const rows = cohortRows(
      [{ cohortYear: 2026, students: 70 }],
      [facts({ status: "cancelled" })],
      false,
    );

    expect(rows).toHaveLength(1);
  });

  it("hides from a limited account a penetapan with nothing of its program", () => {
    const nothing = { groups: 0, members: 0 };
    const assignments = [
      facts({ cohortYear: 2026, status: "draft", ...nothing }),
      facts({ cohortYear: 2025, status: "fixed", ...nothing }),
    ];

    expect(cohortRows([], assignments, true)).toEqual([]);
    expect(cohortRows([], assignments, false)).toHaveLength(2);
  });

  it("shows a limited account a draft whose students of its program wait", () => {
    const rows = cohortRows(
      [{ cohortYear: 2026, students: 4 }],
      [facts({ groups: 0, members: 0 })],
      true,
    );

    expect(rows[0]).toMatchObject({ students: 4, status: "draft" });
  });
});

describe("chosenCohort", () => {
  const LIST: ListedCohort[] = [
    { cohortYear: 2026, students: 68, status: null, isNewest: true },
    { cohortYear: 2025, students: 30, status: "fixed", isNewest: false },
  ];

  it("gives the angkatan asked for", () => {
    expect(chosenCohort(LIST, 2025)?.cohortYear).toBe(2025);
  });

  it("gives the first when none is asked or the one asked is not listed", () => {
    expect(chosenCohort(LIST, null)?.cohortYear).toBe(2026);
    expect(chosenCohort(LIST, 2019)?.cohortYear).toBe(2026);
  });

  it("gives none for an empty list", () => {
    expect(chosenCohort([], 2026)).toBeNull();
  });
});
