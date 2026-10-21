import { describe, expect, it } from "vitest";
import { healthCounts } from "./dorm-health-counts";

const NUMBERS = {
  students: 40,
  dorm: 40,
  listed: 8,
  attention: 3,
  medical: 0,
  medicalWithoutNote: 0,
};

describe("healthCounts", () => {
  it("shows no number below 5 residents in reach", () => {
    for (const students of [0, 1, 4]) {
      expect(healthCounts({ ...NUMBERS, students })).toEqual({
        kind: "too_few",
      });
    }
  });

  it("shows the numbers from 5 residents, each of 1 to 4 as <5", () => {
    expect(healthCounts(NUMBERS)).toEqual({
      kind: "shown",
      residents: 40,
      listed: 8,
      attention: "<5",
      medical: 0,
      medicalWithoutNote: 0,
      listedShare: 20,
    });
    expect(healthCounts({ ...NUMBERS, students: 5 }).kind).toBe("shown");
  });

  it("leaves out the share when the number it is of shows as <5", () => {
    expect(healthCounts({ ...NUMBERS, listed: 2 })).toMatchObject({
      listed: "<5",
      listedShare: null,
    });
  });
});
