import { describe, expect, it } from "vitest";
import type { EvaluationScores } from "./evaluation-aspects";
import {
  evaluationAverage,
  evaluationResult,
  isPoorTotal,
  RESULT_TITLES,
  resultOf,
  shownAverage,
} from "./evaluation-result";

/** Four values that add up to a total, as even as whole numbers allow. */
function scoresWithTotal(total: number): EvaluationScores {
  const low = Math.floor(total / 4);
  const more = total - low * 4;
  return {
    activity: low + (more > 0 ? 1 : 0),
    attendance: low + (more > 1 ? 1 : 0),
    achievement: low + (more > 2 ? 1 : 0),
    feedback: low,
  };
}

describe("evaluationAverage", () => {
  it("is the mean of the four values", () => {
    expect(
      evaluationAverage({
        activity: 90,
        attendance: 80,
        achievement: 70,
        feedback: 60,
      }),
    ).toBe(75);
  });

  it("is kept to one decimal, a half going up", () => {
    expect(evaluationAverage(scoresWithTotal(319))).toBe(79.8);
    expect(evaluationAverage(scoresWithTotal(318))).toBe(79.5);
    expect(evaluationAverage(scoresWithTotal(317))).toBe(79.3);
    expect(evaluationAverage(scoresWithTotal(259))).toBe(64.8);
  });

  it("is 0 for four zeros and 100 for four hundreds", () => {
    expect(evaluationAverage(scoresWithTotal(0))).toBe(0);
    expect(evaluationAverage(scoresWithTotal(400))).toBe(100);
  });
});

describe("resultOf", () => {
  it("is Baik from 80", () => {
    expect(resultOf(80)).toBe("good");
    expect(resultOf(100)).toBe("good");
  });

  it("is Cukup from 65 up to below 80", () => {
    expect(resultOf(79.9)).toBe("fair");
    expect(resultOf(65)).toBe("fair");
  });

  it("is Kurang below 65", () => {
    expect(resultOf(64.9)).toBe("poor");
    expect(resultOf(0)).toBe("poor");
  });
});

describe("evaluationResult", () => {
  it("judges the average that is shown, at each edge", () => {
    expect(evaluationResult(scoresWithTotal(320))).toBe("good");
    expect(evaluationResult(scoresWithTotal(319))).toBe("fair");
    expect(evaluationResult(scoresWithTotal(260))).toBe("fair");
    expect(evaluationResult(scoresWithTotal(259))).toBe("poor");
  });

  it("has a title for each result", () => {
    expect(RESULT_TITLES).toEqual({
      good: "Baik",
      fair: "Cukup",
      poor: "Kurang",
    });
  });
});

describe("isPoorTotal", () => {
  it("agrees with the result of the four values, for every total", () => {
    for (let total = 0; total <= 400; total += 1) {
      const isPoor = evaluationResult(scoresWithTotal(total)) === "poor";
      expect(isPoorTotal(total)).toBe(isPoor);
    }
  });
});

describe("shownAverage", () => {
  it("always shows one decimal, with a comma", () => {
    expect(shownAverage(79.8)).toBe("79,8");
    expect(shownAverage(80)).toBe("80,0");
  });
});
