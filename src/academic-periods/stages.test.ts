import { describe, expect, it } from "vitest";
import { levelOf, STAGES, stageNameOf } from "./stages";

describe("levelOf", () => {
  it("puts two semesters in each level", () => {
    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(semesters.map(levelOf)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("stageNameOf", () => {
  it("names the tahap of each semester", () => {
    expect([1, 2].map(stageNameOf)).toEqual(["Penanaman", "Penanaman"]);
    expect([3, 4].map(stageNameOf)).toEqual(["Penumbuhan", "Penumbuhan"]);
    expect([5, 6].map(stageNameOf)).toEqual(["Pengembangan", "Pengembangan"]);
    expect([7, 8].map(stageNameOf)).toEqual(["Pematangan", "Pematangan"]);
  });

  it("has four tahap", () => {
    expect(STAGES).toHaveLength(4);
  });

  it.each([0, 9, -1])("refuses semester %d, which has no tahap", (semester) => {
    expect(() => stageNameOf(semester)).toThrow();
  });
});
