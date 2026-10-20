import { describe, expect, it } from "vitest";
import { SAMPLE_SCREENINGS } from "@/db/sample-mental-health-screenings";
import { SCREENING_LEVELS } from "./screening-ids";
import {
  COUNSELLING_LEVELS,
  levelOfScore,
  type ScreeningScores,
  scoresOf,
  screeningResult,
} from "./screening-rules";
import { ADVICE_WORDS, CRISIS_ADVICE, LEVEL_WORDS } from "./screening-words";

function dass(
  depression: number,
  anxiety: number,
  stress: number,
  selfHarm = false,
): ScreeningScores {
  return { instrument: "dass21", depression, anxiety, stress, selfHarm };
}

function srq(srqYes: number, selfHarm = false): ScreeningScores {
  return { instrument: "srq20", srqYes, selfHarm };
}

describe("the level of a doubled DASS-21 sum", () => {
  const depression = [10, 14, 21, 28];

  it.each([
    [9, "normal"],
    [10, "mild"],
    [13, "mild"],
    [14, "moderate"],
    [20, "moderate"],
    [21, "severe"],
    [27, "severe"],
    [28, "extremely_severe"],
    [42, "extremely_severe"],
  ] as const)("gives %i the level %s against Depresi", (score, level) => {
    expect(levelOfScore(score, depression)).toBe(level);
  });
});

describe("a DASS-21 result", () => {
  it("doubles each sum: 6, 3, 8 give 12, 6, 16 and Ringan", () => {
    const result = screeningResult(dass(6, 3, 8));
    expect(result.scales).toEqual([
      { scale: "depression", score: 12, level: "mild" },
      { scale: "anxiety", score: 6, level: "normal" },
      { scale: "stress", score: 16, level: "mild" },
    ]);
    expect(result.level).toBe("mild");
  });

  it("takes the worst of the three: 11, 5, 10 give 22, 10, 20 and Berat", () => {
    const result = screeningResult(dass(11, 5, 10));
    expect(result.scales.map((part) => part.score)).toEqual([22, 10, 20]);
    expect(result.level).toBe("severe");
  });

  it.each([
    ["Kecemasan", dass(0, 4, 0), "mild"],
    ["Kecemasan", dass(0, 10, 0), "extremely_severe"],
    ["Stres", dass(0, 0, 13), "severe"],
    ["Stres", dass(0, 0, 17), "extremely_severe"],
  ] as const)("compares %s with its own limits", (_, scores, level) => {
    expect(screeningResult(scores).level).toBe(level);
  });

  it("is Normal for all zeros", () => {
    expect(screeningResult(dass(0, 0, 0)).level).toBe("normal");
  });
});

describe("an SRQ-20 result", () => {
  it.each([
    [0, "normal"],
    [5, "normal"],
    [6, "moderate"],
    [20, "moderate"],
  ] as const)("gives %i ya the level %s", (yes, level) => {
    const result = screeningResult(srq(yes));
    expect(result.level).toBe(level);
    expect(result.scales).toEqual([]);
  });
});

describe("a self-harm tick", () => {
  it.each([
    ["DASS-21", dass(0, 0, 0, true)],
    ["SRQ-20", srq(0, true)],
  ] as const)(
    "makes a %s result Sangat berat, with the crisis advice and Risiko",
    (_, scores) => {
      const result = screeningResult(scores);
      expect(result.level).toBe("extremely_severe");
      expect(result.advice).toBe(CRISIS_ADVICE);
      expect(CRISIS_ADVICE).toBe(
        "Tindak lanjut krisis hari ini sesuai protokol kampus",
      );
      expect(result.risk).toBe(true);
    },
  );

  it("is not a risk when not ticked", () => {
    expect(screeningResult(dass(21, 21, 21)).risk).toBe(false);
  });
});

describe("the advice of a level", () => {
  it("follows the levels in order", () => {
    expect(SCREENING_LEVELS.map((level) => ADVICE_WORDS[level])).toEqual([
      "Tidak perlu tindak lanjut",
      "Psikoedukasi dan pemantauan",
      "Konseling",
      "Konseling segera, pertimbangkan rujukan ke psikolog klinis",
      "Konseling segera dan rujukan ke psikolog klinis atau psikiater",
    ]);
    expect(SCREENING_LEVELS.map((level) => LEVEL_WORDS[level])).toEqual([
      "Normal",
      "Ringan",
      "Sedang",
      "Berat",
      "Sangat berat",
    ]);
  });

  it("is given with the result", () => {
    expect(screeningResult(srq(6)).advice).toBe("Konseling");
    expect(screeningResult(dass(11, 5, 10)).advice).toBe(ADVICE_WORDS.severe);
  });
});

describe("Perlu konseling", () => {
  it("is Sedang and above", () => {
    expect(COUNSELLING_LEVELS).toEqual([
      "moderate",
      "severe",
      "extremely_severe",
    ]);
  });
});

describe("the sample screenings", () => {
  it.each(SAMPLE_SCREENINGS)(
    "hold the level the rules give: $nim, $daysAgo days ago",
    (sample) => {
      const scores = scoresOf(sample);
      expect(scores).not.toBeNull();
      if (scores === null) return;
      expect(screeningResult(scores).level).toBe(sample.level);
    },
  );
});
