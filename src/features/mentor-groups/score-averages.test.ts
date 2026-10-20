import { describe, expect, it } from "vitest";
import {
  activeSummary,
  averageRerata,
  lowestRerataFirst,
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

const LOW = { M: 60, E: 62, D: 64, A: 60, L: 62, I: 64 };
const GOLD = { M: 90, E: 88, D: 86, A: 90, L: 88, I: 86 };
const SILVER = { M: 80, E: 80, D: 80, A: 80, L: 80, I: 80 };

describe("scoreSummary", () => {
  it("gives the average of each value and of the Rerata, to one decimal", () => {
    const summary = scoreSummary([
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
    const summary = scoreSummary([
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

  it("averages the assessment before of the members who have one", () => {
    const summary = scoreSummary([
      { latest: GOLD, earlier: SILVER },
      { latest: SILVER, earlier: LOW },
      { latest: LOW, earlier: null },
    ]);

    expect(summary?.earlier).toEqual({
      M: 70,
      E: 71,
      D: 72,
      A: 70,
      L: 71,
      I: 72,
    });
  });

  it("gives no assessment before when no member has one", () => {
    const summary = scoreSummary([{ latest: GOLD, earlier: null }]);

    expect(summary?.earlier).toBeNull();
  });

  it("gives nothing when nobody is assessed", () => {
    expect(scoreSummary([])).toBeNull();
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

describe("activeSummary", () => {
  it("leaves out the members on Cuti and those not assessed", () => {
    const members = [
      { id: "a", status: "active" as const },
      { id: "b", status: "on_leave" as const },
      { id: "c", status: "active" as const },
    ];
    const scores = new Map([
      ["a", { latest: SILVER, earlier: null }],
      ["b", { latest: LOW, earlier: null }],
    ]);

    const summary = activeSummary(members, scores);

    expect(summary?.rerata).toBe(80);
    expect(summary?.predicates).toEqual({
      gold: 0,
      silver: 1,
      bronze: 0,
      guidance: 0,
    });
  });
});
