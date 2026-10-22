import { describe, expect, it } from "vitest";
import {
  type GradeScheme,
  STARTING_SCHEME,
} from "@/character-grades/scheme-ids";
import { NONE_HELD_BACK } from "./achievement-recap";
import type { EntryPath } from "./dashboard-address";
import { type GradeGroup, gradeCohorts, gradeRecapOf } from "./grade-recap";

/**
 * Students with the same Nilai akhir, or null for "Belum lengkap", each
 * with the parts given, or with parts that are missing.
 */
function groupOf(
  students: number,
  final: number | null,
  limited = 0,
  parts = { attendance: 90, mentoring: 80, siku: 70, skpm: 60 },
): GradeGroup {
  return {
    cohortYear: 2026,
    entryPath: "regular",
    final,
    students,
    limited,
    sums: {
      attendance: parts.attendance * students,
      mentoring: parts.mentoring * students,
      siku: parts.siku * students,
      skpm: parts.skpm * students,
    },
  };
}

describe("gradeRecapOf", () => {
  it("gives no number at all while no student has a worked-out grade", () => {
    expect(gradeRecapOf([groupOf(30, null, 2)], STARTING_SCHEME)).toEqual({
      kind: "none",
    });
    expect(gradeRecapOf([], STARTING_SCHEME)).toEqual({ kind: "none" });
  });

  it("gives no number at all while fewer than 5 have a worked-out grade, however many there are", () => {
    const recap = gradeRecapOf(
      [groupOf(4, 90, 1), groupOf(30, null, 3)],
      STARTING_SCHEME,
    );

    expect(recap).toEqual({ kind: "too_few" });
  });

  it("gives the numbers of a single worked-out grade for Dashboard anak asuh, which holds none back", () => {
    const recap = gradeRecapOf(
      [groupOf(1, 90), groupOf(2, null)],
      STARTING_SCHEME,
      NONE_HELD_BACK,
    );

    expect(recap).toMatchObject({ kind: "shown", graded: 1, meanFinal: 90 });
  });

  it("averages the worked-out grades only, and counts each letter and who meets the pass letter", () => {
    const recap = gradeRecapOf(
      [groupOf(3, 90), groupOf(2, 72.5), groupOf(1, 40), groupOf(6, null)],
      STARTING_SCHEME,
    );

    expect(recap).toMatchObject({
      kind: "shown",
      graded: 6,
      meanFinal: 75.8,
      passing: 83,
      letters: { A: 3, B: 2, C: 0, D: 0, E: 1 },
    });
  });

  it("averages each part over the worked-out grades only, and counts those left out", () => {
    const recap = gradeRecapOf(
      [
        groupOf(4, 80),
        groupOf(1, 40, 0, {
          attendance: 40,
          mentoring: 30,
          siku: 20,
          skpm: 10,
        }),
        groupOf(3, null, 0, {
          attendance: 100,
          mentoring: 0,
          siku: 100,
          skpm: 100,
        }),
      ],
      STARTING_SCHEME,
    );

    expect(recap).toMatchObject({
      kind: "shown",
      graded: 5,
      incomplete: 3,
      parts: { attendance: 80, mentoring: 70, siku: 60, skpm: 50 },
    });
  });

  it("counts every student held at 70, a Belum lengkap one among them", () => {
    const recap = gradeRecapOf(
      [groupOf(5, 70, 2), groupOf(4, null, 1)],
      STARTING_SCHEME,
    );

    expect(recap).toMatchObject({ kind: "shown", limited: 3 });
  });

  it("takes the letters and the pass letter from the scheme given", () => {
    const scheme: GradeScheme = {
      ...STARTING_SCHEME,
      lowerLimits: { A: 95, B: 85, C: 70, D: 60 },
      passLetter: "C",
    };

    const recap = gradeRecapOf([groupOf(3, 90), groupOf(2, 72.5)], scheme);

    expect(recap).toMatchObject({
      passing: 100,
      letters: { A: 0, B: 3, C: 2, D: 0, E: 0 },
    });
  });
});

/** Students of one angkatan and jalur with the same Nilai akhir. */
function inCohort(
  cohortYear: number,
  entryPath: EntryPath,
  students: number,
  final: number | null,
): GradeGroup {
  return { ...groupOf(students, final), cohortYear, entryPath };
}

/** Each row as its angkatan, jalur and how many have a worked-out grade. */
function rowsOf(groups: GradeGroup[], filtered: boolean) {
  return gradeCohorts(groups, STARTING_SCHEME, filtered).map((row) => [
    row.cohortYear,
    row.entryPath,
    row.recap.graded,
  ]);
}

describe("gradeCohorts", () => {
  it("gives one row per angkatan and jalur, the newest first and Reguler before Alih program, with its own numbers", () => {
    const rows = gradeCohorts(
      [
        inCohort(2025, "regular", 20, 80),
        inCohort(2026, "transfer", 20, 60),
        inCohort(2026, "regular", 25, 90),
        inCohort(2026, "regular", 3, null),
      ],
      STARTING_SCHEME,
      false,
    );

    expect(rows.map((row) => [row.cohortYear, row.entryPath])).toEqual([
      [2026, "regular"],
      [2026, "transfer"],
      [2025, "regular"],
    ]);
    expect(rows[0]?.recap).toMatchObject({
      graded: 25,
      incomplete: 3,
      meanFinal: 90,
      passing: 100,
    });
    expect(rows[1]?.recap).toMatchObject({ meanFinal: 60, passing: 0 });
  });

  it("counts only worked-out grades for the rule of 20 without a filter, and of 5 with one, then for the rule of subtraction", () => {
    const groups = [
      inCohort(2026, "regular", 20, 80),
      inCohort(2025, "regular", 19, 80),
      inCohort(2025, "regular", 10, null),
      inCohort(2024, "regular", 5, 80),
      inCohort(2023, "regular", 4, 80),
      inCohort(2023, "regular", 30, null),
    ];

    expect(rowsOf(groups, false)).toEqual([[2026, "regular", 20]]);
    expect(rowsOf(groups, true)).toEqual([
      [2026, "regular", 20],
      [2025, "regular", 19],
    ]);
  });

  it("leaves out the smallest row too while the rows left out hold 1 to 4 worked-out grades", () => {
    const groups = [
      inCohort(2026, "regular", 30, 80),
      inCohort(2025, "regular", 25, 80),
      inCohort(2024, "regular", 3, 80),
    ];

    expect(rowsOf(groups, false)).toEqual([[2026, "regular", 30]]);
  });
});
