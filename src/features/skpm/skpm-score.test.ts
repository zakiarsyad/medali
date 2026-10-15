import { describe, expect, it } from "vitest";
import { skpmScoreOf } from "./skpm-score";

describe("skpmScoreOf", () => {
  it("turns the total points into a score out of the points for 100", () => {
    expect(skpmScoreOf(8 + 12 + 10, 50)).toBe(60);
    expect(skpmScoreOf(17, 50)).toBe(34);
    expect(skpmScoreOf(30, 40)).toBe(75);
  });

  it("stops at 100", () => {
    expect(skpmScoreOf(65, 50)).toBe(100);
    expect(skpmScoreOf(50, 50)).toBe(100);
  });

  it("keeps one decimal, rounded", () => {
    expect(skpmScoreOf(1, 3)).toBe(33.3);
    expect(skpmScoreOf(2, 3)).toBe(66.7);
    expect(skpmScoreOf(7.5, 50)).toBe(15);
  });

  it("gives 0 for no points", () => {
    expect(skpmScoreOf(0, 50)).toBe(0);
  });
});
