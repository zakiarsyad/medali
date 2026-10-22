import { describe, expect, it } from "vitest";
import type { ShownGrades } from "./grade-recap";
import { gradeCardLine, letterParts } from "./grade-words";

const SHOWN: ShownGrades = {
  kind: "shown",
  graded: 1200,
  limited: 14,
  meanFinal: 78.4,
  passing: 81,
  letters: { A: 300, B: 672, C: 0, D: 128, E: 100 },
};

describe("the card Nilai karakter", () => {
  it("says how many meet the pass letter and how many are held at 70", () => {
    expect(gradeCardLine(SHOWN, "B")).toBe(
      "81% memenuhi minimal B. 14 dibatasi 70.",
    );
  });

  it("lays each letter along the bar as its share of the worked-out grades, leaving out a letter nobody has", () => {
    expect(letterParts(SHOWN.letters, SHOWN.graded)).toEqual([
      { letter: "A", start: 0, length: 25 },
      { letter: "B", start: 25, length: 56 },
      { letter: "D", start: 81, length: (128 * 100) / 1200 },
      {
        letter: "E",
        start: 81 + (128 * 100) / 1200,
        length: (100 * 100) / 1200,
      },
    ]);
  });
});
