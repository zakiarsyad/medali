import { describe, expect, it } from "vitest";
import type { FitnessTally } from "@/health-notes/fitness-recap";
import { dormPhysicalOf } from "./dashboard-health-recap";

function tally(
  students: number,
  tested: number,
  byCategory: FitnessTally["byCategory"],
): FitnessTally {
  return { students, tested, byCategory };
}

const NO_CATEGORY = { excellent: 0, good: 0, attention: 0, medical: 0 };

describe("dormPhysicalOf", () => {
  it("adds the dorms up for the bars and gives each dorm its own counts, each of 1 to 4 as <5", () => {
    const physical = dormPhysicalOf([
      {
        key: "dana_rakca",
        tally: tally(10, 9, {
          excellent: 5,
          good: 2,
          attention: 1,
          medical: 1,
        }),
      },
      {
        key: "cipta_bakti",
        tally: tally(2, 2, { ...NO_CATEGORY, excellent: 2 }),
      },
    ]);

    expect(physical.recap).toMatchObject({
      kind: "shown",
      students: 12,
      tested: 11,
      byCategory: { excellent: 7, good: "<5", attention: "<5", medical: "<5" },
      illnesses: null,
    });
    expect(physical.byDorm).toEqual({
      wismantara_putra: NO_CATEGORY,
      wismantara_putri: NO_CATEGORY,
      dana_rakca: { excellent: 5, good: "<5", attention: "<5", medical: "<5" },
      cipta_bakti: { ...NO_CATEGORY, excellent: "<5" },
    });
  });

  it("sends no count at all, of the bars or of a dorm, while 1 to 4 residents are tested", () => {
    const physical = dormPhysicalOf([
      {
        key: "dana_rakca",
        tally: tally(9, 4, { excellent: 4, good: 0, attention: 0, medical: 0 }),
      },
    ]);

    expect(physical).toEqual({
      recap: { kind: "too_few", students: 9 },
      byDorm: null,
    });
  });

  it("says nobody is tested, with no dorm's counts, when no resident in reach is", () => {
    const physical = dormPhysicalOf([
      { key: "wismantara_putri", tally: tally(3, 0, NO_CATEGORY) },
    ]);

    expect(physical).toEqual({
      recap: { kind: "untested", students: 3 },
      byDorm: null,
    });
  });

  it("counts nobody when the account reaches no resident", () => {
    expect(dormPhysicalOf([])).toEqual({
      recap: { kind: "untested", students: 0 },
      byDorm: null,
    });
  });
});
