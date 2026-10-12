import { describe, expect, it } from "vitest";
import { averageSize, isSmallGroup, isUsualSize } from "./group-size";

describe("isUsualSize", () => {
  it.each([25, 30, 35])("takes %i members as a usual size", (size) => {
    expect(isUsualSize(size)).toBe(true);
  });

  it.each([0, 24, 36])("takes %i members as not a usual size", (size) => {
    expect(isUsualSize(size)).toBe(false);
  });
});

describe("isSmallGroup", () => {
  it.each([0, 24])("takes %i members as fewer than usual", (size) => {
    expect(isSmallGroup(size)).toBe(true);
  });

  it.each([25, 36])("takes %i members as not fewer than usual", (size) => {
    expect(isSmallGroup(size)).toBe(false);
  });
});

describe("averageSize", () => {
  it("gives the members of one group on average, as a whole number", () => {
    expect(averageSize(60, 2)).toBe(30);
    expect(averageSize(61, 2)).toBe(31);
    expect(averageSize(31, 3)).toBe(10);
  });

  it("gives 0 when there is no group", () => {
    expect(averageSize(0, 0)).toBe(0);
  });
});
