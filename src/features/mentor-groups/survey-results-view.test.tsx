import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  type MentorSums,
  resultNumbers,
  resultPage,
  type SurveyGroup,
  surveyGroupRows,
} from "./survey-group-list";
import type { ResultPeriod } from "./survey-result-periods";
import {
  NO_RESULT_CHOICES,
  type SurveyResultChoices,
} from "./survey-results-address";
import { SurveyResultsView } from "./survey-results-view";

vi.mock("next/form", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

const PERIOD: ResultPeriod = {
  id: "periode-uji",
  period: { startYear: 2025, term: "even" },
  startsOn: "2026-06-01",
  endsOn: "2026-06-21",
  achievementWeight: 50,
  status: "closed",
  numbersDay: "2026-06-21",
};

function group(number: number, members = 3): SurveyGroup {
  return {
    id: `kelompok-${number}`,
    cohortYear: 2025,
    entryPath: "regular",
    number,
    programCode: "D3PJK",
    studyProgram: "D3 Pajak",
    members,
    mentorId: `pengasuh-${number}`,
    mentorName: `Pengasuh Uji ${number}`,
  };
}

function sums(number: number, ...scores: number[]): MentorSums {
  let total = 0;
  for (const score of scores) total += score * 8;
  return {
    groupId: `kelompok-${number}`,
    mentorId: `pengasuh-${number}`,
    mentorName: `Pengasuh Uji ${number}`,
    answers: scores.length,
    total,
  };
}

const ROWS = surveyGroupRows(
  [group(1), group(2), group(3, 4), group(4)],
  [sums(1, 2, 3, 2), sums(2, 5, 4), sums(4, 5, 5, 5)],
  new Map([
    ["kelompok-1", 74.2],
    ["kelompok-2", 80],
  ]),
  50,
);

function shown(
  period: ResultPeriod = PERIOD,
  choices: SurveyResultChoices = NO_RESULT_CHOICES,
): string {
  return renderToStaticMarkup(
    <SurveyResultsView
      periods={[period]}
      shown={{
        period,
        numbers: resultNumbers(ROWS),
        page: resultPage(ROWS, choices),
      }}
      choices={choices}
    />,
  );
}

describe("SurveyResultsView", () => {
  it("names the period with its days and weights, and offers the periods with their status", () => {
    const view = shown();

    expect(view).toContain("Hasil evaluasi per kelompok");
    expect(view).toContain(
      "Periode Genap 2025/2026 · 1 Jun 2026 sampai 21 Jun 2026 · bobot capaian 50% dan umpan balik 50%",
    );
    expect(view).toContain("Genap 2025/2026 · Ditutup");
  });

  it("shows Responden, Rerata capaian karakter, Rerata umpan balik out of 5 and Nilai evaluasi kurang", () => {
    const view = shown();

    for (const words of [
      "Responden",
      "62%",
      "8 dari 13 mahasiswa",
      "Rerata capaian karakter",
      "77,1",
      "Rerata umpan balik",
      "3,7 / 5",
      "setara 73,4",
      "Nilai evaluasi kurang",
      "dari 4 kelompok",
    ]) {
      expect(view).toContain(words);
    }
  });

  it("shows each group with its code, program and angkatan, mentor, Responden and numbers, lowest first", () => {
    const view = shown();

    for (const words of [
      "KP 25-D3PJK-01",
      "D3 Pajak · angkatan 2025",
      "Pengasuh Uji 1",
      "3/3",
      "100%",
      "74,2",
      "2,3 / 5",
      "46,7",
      "60,5",
      "Kurang",
    ]) {
      expect(view).toContain(words);
    }
    const first = view.indexOf("KP 25-D3PJK-01");
    expect(first).toBeLessThan(view.indexOf("KP 25-D3PJK-02"));
    expect(view.indexOf("KP 25-D3PJK-02")).toBeLessThan(
      view.indexOf("KP 25-D3PJK-04"),
    );
  });

  it("shows Belum ada responden for a group without answers, and Responden only for one with fewer than 3", () => {
    const view = shown();

    expect(view).toContain("Belum ada responden");
    expect(view).toContain("Responden kurang dari 3");
    expect(view).toContain("2/3");
    expect(view).toContain("Belum ada capaian karakter");
  });

  it("says the numbers are temporary while the period is Dibuka, and only then", () => {
    const words = "Angka di bawah sementara";

    expect(shown({ ...PERIOD, status: "open" })).toContain(words);
    expect(shown()).not.toContain(words);
  });

  it("offers the search and the filters, and says so when nothing matches", () => {
    const view = shown(PERIOD, { ...NO_RESULT_CHOICES, query: "tidak ada" });

    expect(view).toContain("Cari kelompok atau pengasuh");
    expect(view).toContain("Semua kelompok");
    expect(view).toContain("Nilai kurang");
    expect(view).toContain("Tidak ada kelompok pada filter ini.");
  });

  it("carries the title of each column in its cells, for the cards of a phone", () => {
    const view = shown();

    expect(view).toMatch(/<table class="[^"]*stacked[^"]*"/);
    for (const title of [
      "Kelompok",
      "Pengasuh",
      "Responden",
      "Capaian karakter",
      "Umpan balik",
      "Nilai evaluasi",
      "Predikat",
    ]) {
      expect(view).toContain(`<th>${title}</th>`);
      expect(view).toContain(`data-title="${title}"`);
    }
  });

  it("asks to open a period while there is none", () => {
    const view = renderToStaticMarkup(
      <SurveyResultsView
        periods={[]}
        shown={null}
        choices={NO_RESULT_CHOICES}
      />,
    );

    expect(view).toContain(
      "Buka periode evaluasi untuk mulai mengumpulkan umpan balik mahasiswa.",
    );
    expect(view).not.toContain("<table");
  });
});
