import { describe, expect, it } from "vitest";
import { STARTING_TEXTS } from "@/ui/medali-starting-texts";
import {
  finalScoreOf,
  INDICATOR_COUNT,
  indicatorScoreRange,
  isIndicatorScore,
  SENTENCE_MAX,
  STARTING_INDICATORS,
} from "./score-indicators";

describe("STARTING_INDICATORS", () => {
  it("starts with the six MEDALI values, in the order of the word", () => {
    expect(STARTING_INDICATORS.map((indicator) => indicator.name)).toEqual([
      "Mandiri",
      "Empati",
      "Disiplin",
      "Adaptif",
      "Loyal",
      "Integritas",
    ]);
    expect(STARTING_INDICATORS).toHaveLength(INDICATOR_COUNT);
  });

  it("gives each value the first-level main indicator text of Kurikulum", () => {
    expect(STARTING_INDICATORS[0]?.sentence).toBe(STARTING_TEXTS.M[0]);
    expect(STARTING_INDICATORS[5]?.sentence).toBe(STARTING_TEXTS.I[0]);
    for (const indicator of STARTING_INDICATORS) {
      expect(indicator.sentence.length).toBeGreaterThan(0);
      expect(indicator.sentence.length).toBeLessThanOrEqual(SENTENCE_MAX);
    }
  });
});

describe("finalScoreOf", () => {
  it.each<[number[], number]>([
    [[4, 5, 4, 3, 5, 4], 83.3],
    [[5, 5, 5, 5, 5, 5], 100],
    [[1, 1, 1, 1, 1, 1], 20],
    [[3, 3, 3, 3, 3, 4], 63.3],
    [[4, 4, 4, 4, 5, 5], 86.7],
  ])(
    "gives the average of %j times 20, to one decimal: %d",
    (scores, final) => {
      expect(finalScoreOf(scores)).toBe(final);
    },
  );

  it.each<[string, (number | null)[]]>([
    ["five scores", [4, 5, 4, 3, 5]],
    ["seven scores", [4, 5, 4, 3, 5, 4, 4]],
    ["a score not filled in", [4, 5, null, 3, 5, 4]],
    ["a score of 0", [0, 5, 4, 3, 5, 4]],
    ["a score of 6", [6, 5, 4, 3, 5, 4]],
    ["a score that is not whole", [4.5, 5, 4, 3, 5, 4]],
  ])("gives none for %s", (_, scores) => {
    expect(finalScoreOf(scores)).toBeNull();
  });
});

describe("isIndicatorScore", () => {
  it("takes the whole numbers from 1 to 5 and nothing else", () => {
    expect(indicatorScoreRange().every(isIndicatorScore)).toBe(true);
    expect(indicatorScoreRange()).toEqual([1, 2, 3, 4, 5]);
    for (const other of [0, 6, 2.5, -1, Number.NaN]) {
      expect(isIndicatorScore(other)).toBe(false);
    }
  });
});
