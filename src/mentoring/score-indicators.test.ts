import { describe, expect, it } from "vitest";
import { STARTING_TEXTS } from "@/ui/medali-starting-texts";
import {
  INDICATOR_COUNT,
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
