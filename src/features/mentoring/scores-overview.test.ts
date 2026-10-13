import { describe, expect, it } from "vitest";
import {
  leftWords,
  scoresOverview,
  shownScoreAverage,
} from "./scores-overview";

describe("scoresOverview", () => {
  it("counts the members with a saved score and those left", () => {
    expect(scoresOverview([80, null, 90, null, null])).toMatchObject({
      scored: 2,
      left: 3,
    });
  });

  it("averages the saved scores alone, so a member without one does not lower it", () => {
    expect(scoresOverview([80, null, 90]).average).toBe(85);
    expect(scoresOverview([70, 75]).average).toBe(72.5);
  });

  it("counts a saved score of 0 as a score", () => {
    expect(scoresOverview([0, 100, null])).toEqual({
      scored: 2,
      left: 1,
      average: 50,
    });
  });

  it("has no average while no member has a score", () => {
    expect(scoresOverview([null, null])).toEqual({
      scored: 0,
      left: 2,
      average: null,
    });
    expect(scoresOverview([])).toEqual({ scored: 0, left: 0, average: null });
  });
});

describe("shownScoreAverage", () => {
  it("shows one decimal with a comma, and a dash where there is none", () => {
    expect(shownScoreAverage(85)).toBe("85,0");
    expect(shownScoreAverage(72.5)).toBe("72,5");
    expect(shownScoreAverage(250 / 3)).toBe("83,3");
    expect(shownScoreAverage(null)).toBe("-");
  });
});

describe("leftWords", () => {
  it("says how many members are left, or that the group is done", () => {
    expect(leftWords(scoresOverview([80, null, null]))).toBe("2 belum diinput");
    expect(leftWords(scoresOverview([80, 90]))).toBe("lengkap");
  });

  it("does not call a group without members done", () => {
    expect(leftWords(scoresOverview([]))).toBe("belum ada anak asuh aktif");
  });
});
