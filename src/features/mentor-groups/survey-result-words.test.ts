import { describe, expect, it } from "vitest";
import type { SurveyGroupResult } from "./survey-result";
import type { ResultPeriod } from "./survey-result-periods";
import {
  feedbackWords,
  fixedByWords,
  fixedResultsWords,
  fixOfferWords,
  fixQuestion,
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
  fixed: null,
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

describe("the words of fixing the results", () => {
  it("offers the fixing with the number of groups that get a line", () => {
    expect(fixOfferWords(4)).toBe(
      "Periode sudah selesai. Tetapkan hasilnya agar 4 kelompok yang memiliki nilai evaluasi masuk ke riwayat evaluasi pengasuh.",
    );
  });

  it("asks first, naming the number of groups and the period", () => {
    expect(fixQuestion(4, PERIOD)).toBe(
      "Tetapkan hasil evaluasi 4 kelompok untuk periode Genap 2025/2026? Hasil masuk ke riwayat evaluasi pengasuh.",
    );
  });

  it("says how many groups got a line", () => {
    expect(fixedResultsWords(1)).toBe("Hasil evaluasi 1 kelompok ditetapkan.");
  });

  it("says who fixed them and when", () => {
    const fixed = {
      at: new Date("2026-06-23T03:00:00Z"),
      byName: "Kepala Uji",
    };

    expect(fixedByWords(fixed)).toBe(
      "Hasil periode ini sudah ditetapkan 23 Jun 2026 oleh Kepala Uji dan masuk ke riwayat evaluasi pengasuh.",
    );
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
