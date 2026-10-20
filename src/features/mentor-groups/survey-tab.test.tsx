import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RunningSurveyCard } from "./survey-card";
import type { SurveyFormStart } from "./survey-form-start";
import { SurveyArea, SurveyPanelBody } from "./survey-tab";

const CARD: RunningSurveyCard = {
  id: "00000000-0000-4000-8000-000000000025",
  period: { startYear: 2026, term: "odd" },
  startsOn: "2026-10-13",
  endsOn: "2026-10-27",
  achievementWeight: 50,
  note: null,
  openerName: "Kepala Uji",
  status: "open",
  respondentPool: 28,
  answered: 0,
  answers: 0,
};

const START: SurveyFormStart = {
  choices: [{ id: "ganjil-2026", title: "Ganjil 2026/2027", wasOpened: false }],
  startsOn: "2026-10-13",
  endsOn: "2026-10-27",
  achievementWeight: 50,
};

const WHO_OPENS_IT =
  "Periode evaluasi pengasuhan dibuka oleh Kepala Unit Pembangunan Karakter.";
const BUTTONS = [
  "Simpan tanggal",
  "Tutup periode sekarang",
  "Batalkan periode",
  "Buka periode evaluasi",
];

/** The tab under its head, as an account that only reads or as Kepala Unit. */
function shownTo(
  reader: "reads" | "kepala unit",
  card: RunningSurveyCard | null,
): string {
  const mayManage = reader === "kepala unit";
  const start = mayManage ? START : null;
  return renderToStaticMarkup(
    <SurveyArea
      mayManage={mayManage}
      panel={
        <SurveyPanelBody card={card} start={start} mayManage={mayManage} />
      }
    />,
  );
}

describe("the tab Evaluasi oleh mahasiswa for a role that only reads", () => {
  it("says who opens a period, and shows the running period and Komponen evaluasi pengasuhan", () => {
    const page = shownTo("reads", CARD);

    expect(page).toContain(WHO_OPENS_IT);
    expect(page).toContain("Periode evaluasi Ganjil 2026/2027");
    expect(page).toContain("0 dari 28");
    expect(page).toContain("Komponen evaluasi pengasuhan");
  });

  it("shows the running period without a button and without a form", () => {
    const page = shownTo("reads", CARD);

    for (const words of BUTTONS) expect(page).not.toContain(words);
    expect(page).not.toContain("<button");
    expect(page).not.toContain("<form");
    expect(page).not.toContain("Ubah tanggal ditutup");
  });

  it("shows the line and Komponen evaluasi pengasuhan, and no form, while no period runs", () => {
    const page = shownTo("reads", null);

    expect(page).toContain(WHO_OPENS_IT);
    expect(page).toContain("Komponen evaluasi pengasuhan");
    expect(page).not.toContain("Buka periode evaluasi pengasuhan");
    expect(page).not.toContain("<button");
    expect(page).not.toContain("<form");
  });

  it("gets no form even when one was read by mistake", () => {
    const page = renderToStaticMarkup(
      <SurveyPanelBody card={null} start={START} mayManage={false} />,
    );

    expect(page).toBe("");
  });
});

describe("the tab Evaluasi oleh mahasiswa for Kepala Unit", () => {
  it("shows the form, and no line about who opens a period, while none runs", () => {
    const page = shownTo("kepala unit", null);

    expect(page).toContain("Buka periode evaluasi pengasuhan");
    expect(page).toContain("Buka periode evaluasi</button>");
    expect(page).not.toContain(WHO_OPENS_IT);
    expect(page).toContain("Komponen evaluasi pengasuhan");
  });

  it("shows the running period with its buttons in place of the form", () => {
    const page = shownTo("kepala unit", CARD);

    expect(page).toContain("Periode evaluasi Ganjil 2026/2027");
    expect(page).toContain("Simpan tanggal");
    expect(page).toContain("Tutup periode sekarang");
    expect(page).toContain("Batalkan periode");
    expect(page).not.toContain("Buka periode evaluasi pengasuhan");
    expect(page).not.toContain(WHO_OPENS_IT);
  });
});
