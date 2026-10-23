import { describe, expect, it } from "vitest";
import { totalOf } from "@/character-scores/assessment-score";
import { MEDALI_VALUES } from "@/ui/medali-values";
import {
  averageRerata,
  lowestRerataFirst,
  type MemberScores,
  type ScoreSums,
  scoreSummary,
} from "./score-averages";

describe("averageRerata", () => {
  it("gives 75.0 for members of 80 and 70, the one not assessed left out", () => {
    const members = [
      { total: 480, students: 1 },
      { total: 420, students: 1 },
    ];

    expect(averageRerata(members)).toBe(75);
  });

  it("takes the average of each member's Rerata, to one decimal", () => {
    // Rerata 80.3 and 70.0, so the average of the two is 75.15, shown 75.2.
    const members = [
      { total: 482, students: 1 },
      { total: 420, students: 1 },
    ];

    expect(averageRerata(members)).toBe(75.2);
  });

  it("counts members with the same total as often as there are of them", () => {
    const members = [
      { total: 480, students: 3 },
      { total: 420, students: 1 },
    ];

    expect(averageRerata(members)).toBe(77.5);
  });

  it("gives an average for a single assessed member", () => {
    expect(averageRerata([{ total: 450, students: 1 }])).toBe(75);
  });

  it("gives none when nobody is assessed", () => {
    expect(averageRerata([])).toBeNull();
  });
});

function allOf(score: number) {
  return { M: score, E: score, D: score, A: score, L: score, I: score };
}

const LOW = { M: 60, E: 62, D: 64, A: 60, L: 62, I: 64 };
const GOLD = { M: 90, E: 88, D: 86, A: 90, L: 88, I: 86 };
const SILVER = { M: 80, E: 80, D: 80, A: 80, L: 80, I: 80 };

/** The sums of one member, as the database gives them for one total. */
function sumsOfOne({ latest, earlier }: MemberScores): ScoreSums {
  const change = { M: 0, E: 0, D: 0, A: 0, L: 0, I: 0 };
  for (const { key } of MEDALI_VALUES) {
    if (earlier !== null) change[key] = latest[key] - earlier[key];
  }
  return {
    total: totalOf(latest),
    students: 1,
    latest,
    changed: earlier === null ? 0 : 1,
    change,
  };
}

function summaryOf(members: readonly MemberScores[]) {
  return scoreSummary(members.map(sumsOfOne));
}

describe("scoreSummary", () => {
  it("gives the average of each value and of the Rerata, to one decimal", () => {
    const summary = summaryOf([
      { latest: GOLD, earlier: null },
      { latest: SILVER, earlier: null },
    ]);

    expect(summary?.values).toEqual({
      M: 85,
      E: 84,
      D: 83,
      A: 85,
      L: 84,
      I: 83,
    });
    expect(summary?.rerata).toBe(84);
  });

  it("counts the members of each predikat", () => {
    const summary = summaryOf([
      { latest: GOLD, earlier: null },
      { latest: SILVER, earlier: null },
      { latest: SILVER, earlier: null },
      { latest: LOW, earlier: null },
    ]);

    expect(summary?.predicates).toEqual({
      gold: 1,
      silver: 2,
      bronze: 0,
      guidance: 1,
    });
  });

  it("draws the assessment before as the average less the average change of the members who have one", () => {
    const summary = summaryOf([
      { latest: GOLD, earlier: SILVER },
      { latest: SILVER, earlier: LOW },
      { latest: LOW, earlier: null },
    ]);

    expect(summary?.earlier).toEqual({
      M: 61.7,
      E: 63.7,
      D: 65.7,
      A: 61.7,
      L: 63.7,
      I: 65.7,
    });
  });

  it("shows no false gain when most members were assessed only once", () => {
    const once: MemberScores = { latest: allOf(85), earlier: null };
    const members = Array.from({ length: 10 }, () => once);
    members.push({ latest: allOf(60), earlier: allOf(50) });

    const summary = summaryOf(members);

    expect(summary?.values.M).toBe(82.7);
    expect(summary?.earlier?.M).toBe(72.7);
  });

  it("gives no assessment before when no member has one", () => {
    const summary = summaryOf([{ latest: GOLD, earlier: null }]);

    expect(summary?.earlier).toBeNull();
  });

  it("gives nothing when nobody is assessed", () => {
    expect(scoreSummary([])).toBeNull();
  });

  it("gives the same medal from the sums of members who share a total", () => {
    const members: MemberScores[] = [
      { latest: SILVER, earlier: LOW },
      { latest: SILVER, earlier: null },
      { latest: GOLD, earlier: SILVER },
    ];
    const [first, second, third] = members.map(sumsOfOne);
    if (!first || !second || !third) throw new Error("No sums were made.");
    const sharedSilver: ScoreSums = {
      total: first.total,
      students: 2,
      latest: allOf(160),
      changed: 1,
      change: first.change,
    };

    expect(scoreSummary([sharedSilver, third])).toEqual(summaryOf(members));
  });
});

describe("lowestRerataFirst", () => {
  it("puts the lowest Rerata first and those not assessed last, each in the order given", () => {
    const members = [
      { name: "a", scores: SILVER },
      { name: "b", scores: null },
      { name: "c", scores: LOW },
      { name: "d", scores: GOLD },
      { name: "e", scores: null },
      { name: "f", scores: LOW },
    ];

    const sorted = lowestRerataFirst(members, (member) => member.scores);

    expect(sorted.map((member) => member.name)).toEqual([
      "c",
      "f",
      "a",
      "d",
      "b",
      "e",
    ]);
  });
});
