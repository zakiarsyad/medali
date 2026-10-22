import { describe, expect, it } from "vitest";
import type { Scores } from "@/character-scores/assessment-score";
import { NONE_HELD_BACK, recapOf, type ScoreGroup } from "./achievement-recap";

function times(scores: Scores, students: number): Scores {
  return {
    M: scores.M * students,
    E: scores.E * students,
    D: scores.D * students,
    A: scores.A * students,
    L: scores.L * students,
    I: scores.I * students,
  };
}

const NONE: Scores = { M: 0, E: 0, D: 0, A: 0, L: 0, I: 0 };

/** Students with the same latest scores, and how many of them improved by `up` each. */
function groupOf(
  students: number,
  scores: Scores | null,
  earlier: { students: number; up: number } = { students: 0, up: 0 },
): ScoreGroup {
  const total =
    scores === null
      ? null
      : scores.M + scores.E + scores.D + scores.A + scores.L + scores.I;
  const up = earlier.up * earlier.students;
  return {
    cohortYear: 2026,
    entryPath: "regular",
    total,
    students,
    sums: scores === null ? NONE : times(scores, students),
    withEarlier: earlier.students,
    changes: { M: up, E: up, D: up, A: up, L: up, I: up },
  };
}

const GOLD: Scores = { M: 90, E: 90, D: 90, A: 90, L: 90, I: 90 };
const LOW: Scores = { M: 60, E: 60, D: 62, A: 60, L: 60, I: 60 };

describe("recapOf", () => {
  it("gives no number at all while fewer than 5 students are assessed, however many there are", () => {
    expect(recapOf([groupOf(4, GOLD), groupOf(30, null)])).toBeNull();
    expect(recapOf([])).toBeNull();
  });

  it("averages the assessed students only, and counts each predikat", () => {
    const recap = recapOf([
      groupOf(3, GOLD),
      groupOf(2, LOW),
      groupOf(5, null),
    ]);

    expect(recap).toMatchObject({
      students: 10,
      assessed: 5,
      spread: { gold: 3, silver: 0, bronze: 0, guidance: 2 },
    });
    // Rerata 90 three times and 60,3 twice.
    expect(recap?.rerata).toBe(78.1);
    expect(recap?.averages.M).toBe(78);
    expect(recap?.averages.D).toBeCloseTo(78.8);
  });

  it("gives the change since the assessment before once 5 students have one, and last semester's averages from it", () => {
    const recap = recapOf([
      groupOf(5, GOLD, { students: 5, up: 4 }),
      groupOf(5, LOW, { students: 0, up: 0 }),
    ]);

    expect(recap?.change?.changes.M).toBe(4);
    expect(recap?.averages.M).toBe(75);
    expect(recap?.change?.last.M).toBe(71);
  });

  it("gives no change while fewer than 5 students have an assessment before their latest", () => {
    const recap = recapOf([groupOf(6, GOLD, { students: 4, up: 4 })]);

    expect(recap).not.toBeNull();
    expect(recap?.change).toBeNull();
  });

  it("gives the numbers of a single student, and their change, for Dashboard anak asuh, which holds none back", () => {
    const recap = recapOf(
      [groupOf(1, GOLD, { students: 1, up: 4 }), groupOf(2, null)],
      NONE_HELD_BACK,
    );

    expect(recap).toMatchObject({ students: 3, assessed: 1, rerata: 90 });
    expect(recap?.change?.changes.M).toBe(4);
    expect(recapOf([groupOf(2, null)], NONE_HELD_BACK)).toBeNull();
  });
});
