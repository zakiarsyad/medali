import { describe, expect, it } from "vitest";
import type { Scores } from "@/character-scores/assessment-score";
import { type ScoreGroup, tahapScores } from "./tahap-scores";

const ODD_2026 = { startYear: 2026, term: "odd" } as const;

function same(score: number): Scores {
  return { M: score, E: score, D: score, A: score, L: score, I: score };
}

/** One student of an angkatan with these latest scores. */
function one(cohortYear: number, scores: Scores): ScoreGroup {
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  return { cohortYear, total, students: 1, sums: scores };
}

describe("tahapScores", () => {
  it("averages each nilai and the Rerata of the students in the tahap", () => {
    const groups = [
      one(2026, { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 }),
      one(2026, { M: 90, E: 60, D: 70, A: 72, L: 81, I: 85 }),
    ];

    expect(tahapScores(groups, ODD_2026, 1)).toEqual({
      values: { M: 85, E: 69, D: 77, A: 72, L: 81.5, I: 85.5 },
      rerata: 78.3,
    });
  });

  it("weighs a group by its students", () => {
    const groups: ScoreGroup[] = [
      { cohortYear: 2026, total: 480, students: 3, sums: same(240) },
      one(2026, same(60)),
    ];

    expect(tahapScores(groups, ODD_2026, 1)).toEqual({
      values: same(75),
      rerata: 75,
    });
  });

  it("counts only the students whose semester falls in the tahap", () => {
    const groups = [one(2026, same(90)), one(2025, same(60))];

    expect(tahapScores(groups, ODD_2026, 1)?.rerata).toBe(90);
    expect(tahapScores(groups, ODD_2026, 2)?.rerata).toBe(60);
  });

  it("gives no scores for a tahap without an assessed student", () => {
    expect(tahapScores([one(2026, same(90))], ODD_2026, 3)).toBeNull();
    expect(tahapScores([], ODD_2026, 1)).toBeNull();
  });

  it("gives no scores while no period runs", () => {
    expect(tahapScores([one(2026, same(90))], null, 1)).toBeNull();
  });
});
