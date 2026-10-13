import { describe, expect, it } from "vitest";
import { SCORE_MAX, SCORE_MIN } from "@/mentoring/score-range";
import { bandOf, bandRange, SCORE_BANDS } from "./score-bands";

describe("bandOf", () => {
  it.each([
    [100, "Sangat aktif, menjadi teladan dan menggerakkan kelompok"],
    [85, "Sangat aktif, menjadi teladan dan menggerakkan kelompok"],
    [84, "Aktif dan konsisten mengikuti pengasuhan"],
    [75, "Aktif dan konsisten mengikuti pengasuhan"],
    [74, "Cukup aktif, perlu dorongan"],
    [65, "Cukup aktif, perlu dorongan"],
    [64, "Kurang aktif, perlu pendampingan khusus"],
    [0, "Kurang aktif, perlu pendampingan khusus"],
  ])("puts %i in the band that says: %s", (score, sentence) => {
    expect(bandOf(score)?.sentence).toBe(sentence);
  });

  it.each([-1, 101, 84.5, Number.NaN])(
    "has no band for %d, which is no score",
    (score) => {
      expect(bandOf(score)).toBeNull();
    },
  );

  it("has one band for every score from the lowest to the highest", () => {
    for (let score = SCORE_MIN; score <= SCORE_MAX; score += 1) {
      const holding = SCORE_BANDS.filter(
        (band) => score >= band.from && score <= band.to,
      );

      expect(holding).toHaveLength(1);
    }
  });
});

describe("bandRange", () => {
  it("writes the bands as the rubric shows them", () => {
    expect(SCORE_BANDS.map(bandRange)).toEqual([
      "85–100",
      "75–84",
      "65–74",
      "0–64",
    ]);
  });
});
