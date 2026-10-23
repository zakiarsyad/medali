import { describe, expect, it } from "vitest";
import { FEWEST_ANSWERS_SHOWN } from "@/mentoring/survey-statements";
import {
  feedbackOutOfFive,
  feedbackScore,
  isShownCount,
  respondentShare,
  statementAverages,
  surveyGroupResult,
  surveyScore,
} from "./survey-result";

/** The sum of every score of answers that all give one score to each statement. */
function totalOf(...answers: number[]): number {
  let total = 0;
  for (const score of answers) total += score * 8;
  return total;
}

describe("isShownCount", () => {
  it("shows a group's numbers from 3 answers, and none below", () => {
    expect(FEWEST_ANSWERS_SHOWN).toBe(3);
    expect(isShownCount(0)).toBe(false);
    expect(isShownCount(1)).toBe(false);
    expect(isShownCount(2)).toBe(false);
    expect(isShownCount(3)).toBe(true);
    expect(isShownCount(30)).toBe(true);
  });
});

describe("feedbackOutOfFive", () => {
  it("is the mean of every score of every answer, to one decimal", () => {
    expect(feedbackOutOfFive({ answers: 3, total: totalOf(4, 4, 5) })).toBe(
      4.3,
    );
    expect(feedbackOutOfFive({ answers: 4, total: totalOf(1, 2, 3, 4) })).toBe(
      2.5,
    );
  });

  it("is kept to one decimal, a half going up", () => {
    // 3 answers of 8 scores summing to 87: 87 / 24 = 3,625.
    expect(feedbackOutOfFive({ answers: 3, total: 87 })).toBe(3.6);
    // 4 answers summing to 106: 106 / 32 = 3,3125.
    expect(feedbackOutOfFive({ answers: 4, total: 106 })).toBe(3.3);
    // 4 answers summing to 110: 110 / 32 = 3,4375.
    expect(feedbackOutOfFive({ answers: 4, total: 110 })).toBe(3.4);
    // 5 answers summing to 142: 142 / 40 = 3,55.
    expect(feedbackOutOfFive({ answers: 5, total: 142 })).toBe(3.6);
  });

  it("is nothing for fewer than 3 answers", () => {
    expect(feedbackOutOfFive({ answers: 2, total: totalOf(5, 5) })).toBe(null);
    expect(feedbackOutOfFive({ answers: 0, total: 0 })).toBe(null);
  });
});

describe("feedbackScore", () => {
  it("turns the scale of 1 to 5 into 0 to 100 as the score divided by 5 times 100", () => {
    expect(feedbackScore({ answers: 3, total: totalOf(5, 5, 5) })).toBe(100);
    expect(feedbackScore({ answers: 3, total: totalOf(1, 1, 1) })).toBe(20);
    expect(feedbackScore({ answers: 4, total: totalOf(1, 2, 3, 4) })).toBe(50);
  });

  it("is worked out from the scores, not from the rounded score out of 5, to one decimal, a half going up", () => {
    // 87 / 24 / 5 × 100 = 72,5.
    expect(feedbackScore({ answers: 3, total: 87 })).toBe(72.5);
    // 106 / 32 / 5 × 100 = 66,25.
    expect(feedbackScore({ answers: 4, total: 106 })).toBe(66.3);
    // 100 / 24 / 5 × 100 = 83,33….
    expect(feedbackScore({ answers: 3, total: 100 })).toBe(83.3);
  });

  it("is nothing for fewer than 3 answers", () => {
    expect(feedbackScore({ answers: 2, total: totalOf(4, 4) })).toBe(null);
  });
});

describe("surveyScore", () => {
  it("joins Capaian karakter and Umpan balik by the weights of the period", () => {
    expect(surveyScore(80, 60, 50)).toBe(70);
    expect(surveyScore(80, 60, 70)).toBe(74);
    expect(surveyScore(80, 60, 0)).toBe(60);
    expect(surveyScore(80, 60, 100)).toBe(80);
  });

  it("is kept to one decimal, a half going up", () => {
    expect(surveyScore(74.2, 50.1, 50)).toBe(62.2);
    expect(surveyScore(74.3, 50, 50)).toBe(62.2);
    expect(surveyScore(77.7, 66.3, 30)).toBe(69.7);
  });

  it("is nothing without one of its two parts", () => {
    expect(surveyScore(null, 60, 50)).toBe(null);
    expect(surveyScore(80, null, 50)).toBe(null);
  });
});

describe("respondentShare", () => {
  it("is the share of the members who answered, as a whole percent", () => {
    expect(respondentShare(1, 3)).toBe(33);
    expect(respondentShare(2, 3)).toBe(67);
    expect(respondentShare(3, 3)).toBe(100);
  });

  it("is nothing for a group without members", () => {
    expect(respondentShare(0, 0)).toBe(null);
  });
});

describe("statementAverages", () => {
  it("gives the mean of each statement, to one decimal", () => {
    const sums = [12, 13, 14, 15, 9, 10, 11, 8];

    expect(statementAverages({ answers: 3, sums })).toEqual([
      4, 4.3, 4.7, 5, 3, 3.3, 3.7, 2.7,
    ]);
  });

  it("gives nothing for fewer than 3 answers", () => {
    expect(
      statementAverages({ answers: 2, sums: [8, 8, 8, 8, 8, 8, 8, 8] }),
    ).toBe(null);
  });
});

describe("surveyGroupResult", () => {
  it("gives every number of a group with enough answers, and its predikat", () => {
    const result = surveyGroupResult(
      { answers: 3, total: totalOf(3, 3, 2), members: 4, achievement: 74.2 },
      50,
    );

    expect(result).toEqual({
      answers: 3,
      members: 4,
      share: 75,
      achievement: 74.2,
      feedbackOutOfFive: 2.7,
      feedback: 53.3,
      score: 63.8,
      result: "poor",
    });
  });

  it("gives a group with 1 or 2 answers its Responden and Capaian karakter only", () => {
    const result = surveyGroupResult(
      { answers: 2, total: totalOf(5, 5), members: 3, achievement: 81 },
      50,
    );

    expect(result).toEqual({
      answers: 2,
      members: 3,
      share: 67,
      achievement: 81,
      feedbackOutOfFive: null,
      feedback: null,
      score: null,
      result: null,
    });
  });

  it("gives no Nilai evaluasi nor predikat to a group whose members have no assessment", () => {
    const result = surveyGroupResult(
      { answers: 3, total: totalOf(5, 5, 5), members: 3, achievement: null },
      50,
    );

    expect(result.feedback).toBe(100);
    expect(result.score).toBe(null);
    expect(result.result).toBe(null);
  });

  it("judges the predikat on the Nilai evaluasi shown: Baik from 80, Cukup from 65", () => {
    const at = (achievement: number) =>
      surveyGroupResult(
        { answers: 3, total: totalOf(4, 4, 4), members: 3, achievement },
        50,
      ).result;

    // Umpan balik 80, so Nilai evaluasi is the mean of 80 and Capaian karakter.
    expect(at(80)).toBe("good");
    expect(at(79.9)).toBe("good");
    expect(at(79.7)).toBe("fair");
    expect(at(50)).toBe("fair");
    expect(at(49.8)).toBe("poor");
  });
});
