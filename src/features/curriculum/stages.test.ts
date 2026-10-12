import { describe, expect, it } from "vitest";
import { semesterOf, TAHAP } from "./stages";

describe("TAHAP", () => {
  it("lists the four tahap in order, each with a description", () => {
    expect(TAHAP.map(({ no, name }) => [no, name])).toEqual([
      [1, "Penanaman"],
      [2, "Penumbuhan"],
      [3, "Pengembangan"],
      [4, "Pematangan"],
    ]);
    for (const tahap of TAHAP) expect(tahap.description).not.toBe("");
  });
});

describe("semesterOf", () => {
  it("gives semesters 1, 3, 5, 7 for semester ganjil", () => {
    expect(TAHAP.map(({ no }) => semesterOf(no, "odd"))).toEqual([1, 3, 5, 7]);
  });

  it("gives semesters 2, 4, 6, 8 for semester genap", () => {
    expect(TAHAP.map(({ no }) => semesterOf(no, "even"))).toEqual([2, 4, 6, 8]);
  });
});
