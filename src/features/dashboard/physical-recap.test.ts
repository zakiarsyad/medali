import { describe, expect, it } from "vitest";
import { type FitnessTally, physicalRecapOf } from "./physical-recap";

const TALLY: FitnessTally = {
  students: 40,
  tested: 30,
  byCategory: { excellent: 10, good: 8, attention: 6, medical: 6 },
};

describe("physicalRecapOf", () => {
  it("gives the counts of each final category, those not tested and the share of prima and baik", () => {
    expect(physicalRecapOf(TALLY)).toEqual({
      kind: "shown",
      students: 40,
      tested: 30,
      untested: 10,
      byCategory: { excellent: 10, good: 8, attention: 6, medical: 6 },
      fitShare: 60,
    });
  });

  it("tells a group with no test apart, with only how many students it holds", () => {
    const none = { excellent: 0, good: 0, attention: 0, medical: 0 };

    expect(
      physicalRecapOf({ students: 7, tested: 0, byCategory: none }),
    ).toEqual({ kind: "untested", students: 7 });
  });

  it("gives no count at all while fewer than 5 are tested, also with a note that sets a category", () => {
    for (const tested of [1, 4]) {
      expect(
        physicalRecapOf({
          students: 40,
          tested,
          byCategory: { excellent: 0, good: 0, attention: 1, medical: 6 },
        }),
      ).toEqual({ kind: "too_few", students: 40 });
    }
  });

  it("sends a count of 1 to 4 only as <5, also those not tested", () => {
    const recap = physicalRecapOf({
      students: 33,
      tested: 30,
      byCategory: { excellent: 20, good: 0, attention: 4, medical: 6 },
    });

    expect(recap).toMatchObject({
      untested: "<5",
      byCategory: { excellent: 20, good: 0, attention: "<5", medical: 6 },
      fitShare: 67,
    });
  });

  it("leaves out the share while prima and baik hold 1 to 4 together, as it would give the number back", () => {
    const recap = physicalRecapOf({
      students: 30,
      tested: 30,
      byCategory: { excellent: 1, good: 3, attention: 20, medical: 6 },
    });

    expect(recap).toMatchObject({
      byCategory: { excellent: "<5", good: "<5" },
      fitShare: null,
    });
  });

  it("takes the share of the students with a category, a student with only a note among them", () => {
    const recap = physicalRecapOf({
      students: 12,
      tested: 5,
      byCategory: { excellent: 5, good: 0, attention: 0, medical: 5 },
    });

    expect(recap).toMatchObject({ tested: 5, untested: 7, fitShare: 50 });
  });
});
