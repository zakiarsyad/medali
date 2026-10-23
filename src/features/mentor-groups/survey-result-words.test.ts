import { describe, expect, it } from "vitest";
import type { SurveyGroupResult } from "./survey-result";
import type { ResultPeriod } from "./survey-result-periods";
import {
  feedbackWords,
  missingResultWords,
  periodChoiceWords,
  respondentsWords,
  resultPeriodWords,
  shownNumber,
} from "./survey-result-words";

const PERIOD: ResultPeriod = {
  id: "periode",
  period: { startYear: 2025, term: "even" },
  startsOn: "2026-06-01",
  endsOn: "2026-06-21",
  achievementWeight: 40,
  status: "closed",
  numbersDay: "2026-06-21",
};

function result(more: Partial<SurveyGroupResult>): SurveyGroupResult {
  return {
    answers: 3,
    members: 4,
    share: 75,
    achievement: 70,
    feedbackOutOfFive: 4,
    feedback: 80,
    score: 76,
    result: "fair",
    ...more,
  };
}

describe("resultPeriodWords", () => {
  it("names the period, its days and both weights", () => {
    expect(resultPeriodWords(PERIOD)).toBe(
      "Periode Genap 2025/2026 · 1 Jun 2026 sampai 21 Jun 2026 · bobot capaian 40% dan umpan balik 60%",
    );
  });
});

describe("periodChoiceWords", () => {
  it("names the period with its status", () => {
    expect(periodChoiceWords(PERIOD)).toBe("Genap 2025/2026 · Ditutup");
    expect(periodChoiceWords({ ...PERIOD, status: "open" })).toBe(
      "Genap 2025/2026 · Dibuka",
    );
  });
});

describe("shownNumber", () => {
  it("writes one decimal with a comma, or a dash for none", () => {
    expect(shownNumber(74.2)).toBe("74,2");
    expect(shownNumber(80)).toBe("80,0");
    expect(shownNumber(null)).toBe("-");
  });
});

describe("feedbackWords", () => {
  it("writes Umpan balik out of 5", () => {
    expect(feedbackWords(4.3)).toBe("4,3 / 5");
    expect(feedbackWords(null)).toBe("-");
  });
});

describe("respondentsWords", () => {
  it("writes who answered out of the members", () => {
    expect(respondentsWords(3, 4)).toBe("3/4");
  });
});

describe("missingResultWords", () => {
  it("says why a group has no Predikat", () => {
    expect(missingResultWords(result({ answers: 0 }))).toBe(
      "Belum ada responden",
    );
    expect(missingResultWords(result({ answers: 2 }))).toBe(
      "Responden kurang dari 3",
    );
    expect(missingResultWords(result({ achievement: null }))).toBe(
      "Belum ada capaian karakter",
    );
  });
});
