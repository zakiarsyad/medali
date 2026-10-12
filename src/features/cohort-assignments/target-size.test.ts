import { describe, expect, it } from "vitest";
import {
  clampTargetSize,
  DEFAULT_TARGET_SIZE,
  groupCount,
} from "./target-size";

describe("clampTargetSize", () => {
  it("starts at 30", () => {
    expect(DEFAULT_TARGET_SIZE).toBe(30);
  });

  it.each([25, 30, 35])("keeps %i", (size) => {
    expect(clampTargetSize(size)).toBe(size);
  });

  it("brings a size outside 25 to 35 back to the nearest end", () => {
    expect(clampTargetSize(10)).toBe(25);
    expect(clampTargetSize(24)).toBe(25);
    expect(clampTargetSize(36)).toBe(35);
    expect(clampTargetSize(400)).toBe(35);
    expect(clampTargetSize(-3)).toBe(25);
  });

  it("rounds to a whole number", () => {
    expect(clampTargetSize(29.6)).toBe(30);
    expect(clampTargetSize(34.9)).toBe(35);
  });

  it("takes what is no number, and 0, as 30", () => {
    expect(clampTargetSize(Number.NaN)).toBe(30);
    expect(clampTargetSize(0)).toBe(30);
  });
});

describe("groupCount", () => {
  it.each([
    [60, 30, 2],
    [90, 30, 3],
    [34, 30, 1],
    [34, 25, 1],
    [1, 30, 1],
    [70, 35, 2],
    [100, 30, 3],
  ])(
    "makes of %i students at a target of %i: %i groups",
    (students, target, groups) => {
      expect(groupCount(students, target)).toBe(groups);
    },
  );

  it("makes one group of fewer than 25 students, and none of nobody", () => {
    expect(groupCount(12, 30)).toBe(1);
    expect(groupCount(0, 30)).toBe(0);
  });

  it("takes a group away while the groups would hold fewer than 25", () => {
    // 62 at a target of 25 rounds to 2 groups of 31, which stays.
    expect(groupCount(62, 25)).toBe(2);
    // 70 at a target of 25 rounds to 3 groups of 23, so one is taken.
    expect(groupCount(70, 25)).toBe(2);
  });

  it("keeps groups under 25 when one group fewer would hold more than 35", () => {
    expect(groupCount(49, 25)).toBe(2);
    expect(groupCount(40, 35)).toBe(2);
  });

  it("adds a group while the groups would hold more than 35", () => {
    // 40 at a target of 30 rounds to 1 group of 40, so one is added.
    expect(groupCount(40, 30)).toBe(2);
    expect(groupCount(36, 35)).toBe(2);
  });

  it("uses a target outside 25 to 35 as its nearest end", () => {
    expect(groupCount(100, 10)).toBe(groupCount(100, 25));
    expect(groupCount(100, 90)).toBe(groupCount(100, 35));
  });
});
