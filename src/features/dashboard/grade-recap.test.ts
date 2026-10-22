import { describe, expect, it } from "vitest";
import {
  type GradeScheme,
  STARTING_SCHEME,
} from "@/character-grades/scheme-ids";
import { type GradeGroup, gradeRecapOf } from "./grade-recap";

/** Students with the same Nilai akhir, or null for "Belum lengkap". */
function groupOf(
  students: number,
  final: number | null,
  limited = 0,
): GradeGroup {
  return { cohortYear: 2026, entryPath: "regular", final, students, limited };
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
