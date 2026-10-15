import { describe, expect, it } from "vitest";
import { countAssessed } from "./assessment-counts";

describe("countAssessed", () => {
  it("counts those with any assessment, those whose latest is of the running period, and those with none", () => {
    const counted = countAssessed([
      { students: 2, latest: { total: 482, inRunningPeriod: true } },
      { students: 1, latest: { total: 510, inRunningPeriod: false } },
      { students: 3, latest: null },
    ]);

    expect(counted).toEqual({
      students: 6,
      assessed: 3,
      assessedThisPeriod: 2,
      notAssessed: 3,
      // 80.3, 80.3 and 85.0.
      meanRerata: 81.9,
    });
  });

  it("averages the students' Rerata, each as shown, to one decimal", () => {
    // 80.3 and 84.8: their average is 82.55, shown as 82.6.
    const counted = countAssessed([
      { students: 1, latest: { total: 482, inRunningPeriod: true } },
      { students: 1, latest: { total: 509, inRunningPeriod: true } },
    ]);

    expect(counted.meanRerata).toBe(82.6);
  });

  it("keeps every assessed student when a new semester starts: Sudah diasesmen stays, only Diasesmen semester ini starts again", () => {
    const before = countAssessed([
      { students: 4, latest: { total: 480, inRunningPeriod: true } },
      { students: 1, latest: null },
    ]);
    const newSemester = countAssessed([
      { students: 4, latest: { total: 480, inRunningPeriod: false } },
      { students: 1, latest: null },
    ]);

    expect(newSemester.assessed).toBe(before.assessed);
    expect(newSemester.notAssessed).toBe(before.notAssessed);
    expect(newSemester.meanRerata).toBe(before.meanRerata);
    expect(newSemester.assessedThisPeriod).toBe(0);
  });

  it("has no Rerata capaian while nobody is assessed", () => {
    expect(countAssessed([{ students: 2, latest: null }])).toEqual({
      students: 2,
      assessed: 0,
      assessedThisPeriod: 0,
      notAssessed: 2,
      meanRerata: null,
    });
    expect(countAssessed([]).meanRerata).toBeNull();
  });
});
