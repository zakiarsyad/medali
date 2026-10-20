import { describe, expect, it } from "vitest";
import { answeredCount, checkSurveyAnswer } from "./own-survey-rules";

const FULL = [5, 4, 3, 2, 1, 2, 3, 4];

describe("checkSurveyAnswer", () => {
  it("keeps eight scores and a suggestion without the spaces around it", () => {
    expect(checkSurveyAnswer(FULL, "  Lanjutkan.  ")).toEqual({
      ok: true,
      value: { scores: FULL, suggestion: "Lanjutkan." },
    });
  });

  it("keeps no suggestion when none or only spaces were typed", () => {
    expect(checkSurveyAnswer(FULL, "   ")).toEqual({
      ok: true,
      value: { scores: FULL, suggestion: null },
    });
  });

  it("names the first statement left unanswered", () => {
    expect(checkSurveyAnswer([5, 4, 0, 2, 0, 2, 3, 4], "")).toEqual({
      ok: false,
      error: "Pernyataan 3 belum dijawab.",
    });
  });

  it("names a statement for which nothing was sent", () => {
    expect(checkSurveyAnswer([5, 4, 3, 2, 1, 2, 3], "")).toEqual({
      ok: false,
      error: "Pernyataan 8 belum dijawab.",
    });
  });
});

describe("checkSurveyAnswer of a long suggestion", () => {
  it("keeps 600 characters and refuses 601", () => {
    expect(checkSurveyAnswer(FULL, "a".repeat(600)).ok).toBe(true);
    expect(checkSurveyAnswer(FULL, "a".repeat(601))).toEqual({
      ok: false,
      error: "Saran untuk pengasuh paling banyak 600 karakter.",
    });
  });
});

describe("answeredCount", () => {
  it("counts the statements with a score", () => {
    expect(answeredCount([5, 0, 3, 0, 0, 0, 0, 0])).toBe(2);
    expect(answeredCount(FULL)).toBe(8);
  });
});
