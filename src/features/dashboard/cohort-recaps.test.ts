import { describe, expect, it } from "vitest";
import type { ScoreGroup } from "./achievement-recap";
import { cohortRecaps } from "./cohort-recaps";
import type { EntryPath } from "./dashboard-address";

const SCORE = 80;

function groupOf(
  cohortYear: number,
  entryPath: EntryPath,
  students: number,
  assessed = true,
): ScoreGroup {
  const each = assessed ? SCORE * students : 0;
  const sums = { M: each, E: each, D: each, A: each, L: each, I: each };
  return {
    cohortYear,
    entryPath,
    total: assessed ? SCORE * 6 : null,
    students,
    sums,
    withEarlier: 0,
    changes: { M: 0, E: 0, D: 0, A: 0, L: 0, I: 0 },
  };
}

function keysOf(groups: ScoreGroup[], filtered: boolean): string[] {
  return cohortRecaps(groups, filtered).map(
    (row) => `${row.cohortYear} ${row.entryPath} ${row.recap.assessed}`,
  );
}

describe("cohortRecaps", () => {
  it("gives one row per angkatan and jalur, the newest first and Reguler before Alih program", () => {
    const groups = [
      groupOf(2024, "regular", 20),
      groupOf(2025, "transfer", 21),
      groupOf(2025, "regular", 15),
      groupOf(2025, "regular", 10),
    ];

    expect(keysOf(groups, false)).toEqual([
      "2025 regular 25",
      "2025 transfer 21",
      "2024 regular 20",
    ]);
  });

  it("leaves out a cohort under 20 assessed students without a filter, counting only those assessed", () => {
    const groups = [
      groupOf(2025, "regular", 19),
      groupOf(2025, "regular", 30, false),
    ];

    expect(keysOf(groups, false)).toEqual([]);
    expect(keysOf(groups, true)).toEqual(["2025 regular 19"]);
  });

  it("shows no row when the one left out would be found by subtracting the shown row from the whole", () => {
    const groups = [groupOf(2024, "regular", 50), groupOf(2022, "transfer", 1)];

    expect(keysOf(groups, false)).toEqual([]);
  });

  it("also leaves out the smallest shown row, until those left out hold at least 5", () => {
    const groups = [
      groupOf(2026, "regular", 40),
      groupOf(2025, "regular", 30),
      groupOf(2024, "regular", 30),
      groupOf(2022, "transfer", 2),
      groupOf(2023, "transfer", 1, false),
    ];

    expect(keysOf(groups, false)).toEqual([
      "2026 regular 40",
      "2025 regular 30",
    ]);
    expect(keysOf(groups, true)).toEqual([
      "2026 regular 40",
      "2025 regular 30",
    ]);
  });

  it("never shows a cohort under 5 assessed students, also with a filter", () => {
    const groups = [
      groupOf(2025, "regular", 4),
      groupOf(2025, "transfer", 1),
      groupOf(2024, "regular", 5),
    ];

    expect(keysOf(groups, true)).toEqual(["2024 regular 5"]);
  });
});
