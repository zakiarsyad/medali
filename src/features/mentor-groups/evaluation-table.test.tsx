import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ListedEvaluation } from "./evaluation-rows";
import { EvaluationTable } from "./evaluation-table";

const EVALUATION: ListedEvaluation = {
  id: "00000000-0000-4000-8000-000000000001",
  period: { startYear: 2026, term: "odd" },
  group: {
    cohortYear: 2024,
    entryPath: "regular",
    number: 1,
    programCode: "UJI",
  },
  mentorName: "Pengasuh Uji Ani",
  activity: 55,
  attendance: 62,
  achievement: 60,
  feedback: 58,
  note: "Perlu rencana perbaikan.",
  evaluatedAt: new Date("2026-10-13T03:00:00Z"),
  evaluatorName: "Kepala Uji",
};

function shown(evaluations: ListedEvaluation[]): string {
  return renderToStaticMarkup(<EvaluationTable evaluations={evaluations} />);
}

describe("EvaluationTable", () => {
  it("shows the period, the mentor, the group, the four values, the result, and when, by whom and the note", () => {
    const table = shown([EVALUATION]);

    for (const words of [
      "Ganjil 2026/2027",
      "Pengasuh Uji Ani",
      "KP 24-UJI-01",
      ">55<",
      ">62<",
      ">60<",
      ">58<",
      "Kurang · 58,8",
      "13 Okt 2026 · Kepala Uji",
      "Perlu rencana perbaikan.",
    ]) {
      expect(table).toContain(words);
    }
  });

  it("carries the title of each column in its cells, for the cards of a phone", () => {
    const table = shown([EVALUATION]);

    expect(table).toMatch(/<table class="[^"]*stacked[^"]*"/);
    for (const title of [
      "Periode",
      "Pengasuh",
      "Kelompok",
      "Keaktifan",
      "Kehadiran",
      "Capaian",
      "Umpan balik",
      "Hasil",
      "Dievaluasi",
    ]) {
      expect(table).toContain(`<th>${title}</th>`);
      expect(table).toContain(`data-title="${title}"`);
    }
  });

  it("says so when there is no evaluation", () => {
    expect(shown([])).toContain("Belum ada evaluasi.");
  });
});
