import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RunningSurveyCard } from "./survey-card";
import { SurveyCard } from "./survey-card-view";

const CARD: RunningSurveyCard = {
  id: "00000000-0000-4000-8000-000000000025",
  period: { startYear: 2026, term: "odd" },
  startsOn: "2026-10-13",
  endsOn: "2026-10-27",
  achievementWeight: 60,
  note: null,
  openerName: "Kepala Uji",
  status: "open",
  respondentPool: 28,
};

function shown(more: Partial<RunningSurveyCard> = {}): string {
  return renderToStaticMarkup(<SurveyCard card={{ ...CARD, ...more }} />);
}

describe("the card of the running survey period", () => {
  it("names the Periode, its dates and who opened it", () => {
    const page = shown();

    expect(page).toContain("Periode evaluasi Ganjil 2026/2027");
    expect(page).toContain(
      "13 Okt 2026 sampai 27 Okt 2026 · dibuka oleh Kepala Uji",
    );
  });

  it("shows Responden as none of the students who can answer, and both weights", () => {
    const page = shown();

    expect(page).toContain("<dt>Responden</dt><dd>0 dari 28</dd>");
    expect(page).toContain(
      "<dt>Bobot</dt><dd>Capaian 60% · umpan balik 40%</dd>",
    );
  });

  it.each([
    ["open", "Dibuka"],
    ["scheduled", "Terjadwal"],
  ] as const)(
    "shows the status of a period that is %s as %s",
    (status, title) => {
      expect(shown({ status })).toMatch(
        new RegExp(`<span class="[^"]*badge[^"]*">${title}</span>`),
      );
    },
  );

  it("shows the note only when the period has one", () => {
    expect(shown()).not.toContain("Keterangan");
    expect(shown({ note: "Isi sebelum akhir bulan." })).toContain(
      "<dt>Keterangan</dt><dd>Isi sebelum akhir bulan.</dd>",
    );
  });

  it("holds no button: what may be done with the period stands under it for Kepala Unit only", () => {
    expect(shown()).not.toContain("<button");
    expect(shown()).not.toContain("<form");
  });
});
