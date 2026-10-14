import { describe, expect, it } from "vitest";
import { isCurrent, isRoutine, mayChange } from "./activity-row";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

const TODAY = "2026-10-14";

describe("isRoutine", () => {
  it("tells a repeating activity from a one-off one", () => {
    expect(isRoutine(TEST_ROW)).toBe(true);
    expect(isRoutine({ pattern: "monthly" })).toBe(true);
    expect(isRoutine(TEST_ONE_OFF)).toBe(false);
  });
});

describe("isCurrent", () => {
  it("takes the newest version of an activity that is not removed as what it holds now", () => {
    expect(isCurrent(TEST_ROW)).toBe(true);
    expect(isCurrent({ ...TEST_ROW, shownUntil: "2026-10-13" })).toBe(false);
    expect(isCurrent({ ...TEST_ROW, removedFrom: TODAY })).toBe(false);
  });
});

describe("mayChange", () => {
  it("offers a change of a repeating activity as it is now, whatever day it is shown on", () => {
    expect(mayChange(TEST_ROW, TODAY)).toBe(true);
  });

  it("offers no change of an earlier version, or of a removed activity", () => {
    expect(mayChange({ ...TEST_ROW, shownUntil: "2026-10-13" }, TODAY)).toBe(
      false,
    );
    expect(mayChange({ ...TEST_ROW, removedFrom: TODAY }, TODAY)).toBe(false);
  });

  it("offers a change of a one-off activity of today or later, and none of a day gone by", () => {
    expect(mayChange(TEST_ONE_OFF, TODAY)).toBe(true);
    expect(mayChange(TEST_ONE_OFF, "2026-10-13")).toBe(true);
    expect(mayChange(TEST_ONE_OFF, "2026-10-15")).toBe(false);
  });
});
