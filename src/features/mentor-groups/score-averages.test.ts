import { describe, expect, it } from "vitest";
import { averageRerata } from "./score-averages";

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
