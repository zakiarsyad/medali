import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SurveyComponents } from "./survey-components";
import type { SurveyFormStart } from "./survey-form-start";
import { SurveyOpenForm } from "./survey-open-form";
import { SurveySaidAbove } from "./survey-said";
import { SURVEY_STATEMENTS } from "./survey-statements";

const START: SurveyFormStart = {
  choices: [
    { id: "ganjil-2026", title: "Ganjil 2026/2027", wasOpened: false },
    { id: "genap-2025", title: "Genap 2025/2026", wasOpened: true },
  ],
  startsOn: "2026-10-13",
  endsOn: "2026-10-27",
  achievementWeight: 50,
};

function shownForm(): string {
  return renderToStaticMarkup(
    <SurveySaidAbove>
      <SurveyOpenForm start={START} />
    </SurveySaidAbove>,
  );
}

/** The tag of the field with a name, as the page writes it. */
function fieldOf(page: string, name: string): string {
  return page.match(new RegExp(`<[^>]*name="${name}"[^>]*>`))?.[0] ?? "";
}

describe("Buka periode evaluasi pengasuhan", () => {
  it("names every field as the prototype does", () => {
    const page = shownForm();

    for (const label of [
      "Periode",
      "Tanggal dibuka",
      "Tanggal ditutup",
      "Bobot capaian karakter (%)",
      "Bobot umpan balik mahasiswa (%)",
      "Keterangan untuk mahasiswa (opsional)",
      "Buka periode evaluasi",
    ]) {
      expect(page).toContain(label);
    }
  });

  it("opens with the running academic period first, today, 14 days later and 50", () => {
    const page = shownForm();

    expect(page.indexOf("Ganjil 2026/2027")).toBeLessThan(
      page.indexOf("Genap 2025/2026"),
    );
    expect(fieldOf(page, "startsOn")).toContain('value="2026-10-13"');
    expect(fieldOf(page, "endsOn")).toContain('value="2026-10-27"');
    expect(fieldOf(page, "achievementWeight")).toContain('value="50"');
  });

  it("shows the second weight as the rest of 100, switched off and sent by no name", () => {
    const page = shownForm();
    const second = page.slice(page.indexOf("Bobot umpan balik mahasiswa (%)"));
    const field = second.match(/<input[^>]*>/)?.[0] ?? "";

    expect(field).toContain('value="50"');
    expect(field).toContain("disabled");
    expect(field).not.toContain("name=");
  });

  it("leaves the checking to the server, which says what is wrong", () => {
    expect(shownForm()).toMatch(/<form[^>]*novalidate/i);
  });
});

describe("Komponen evaluasi pengasuhan", () => {
  it("explains the two parts and how they are joined", () => {
    const page = renderToStaticMarkup(<SurveyComponents />);

    expect(page).toContain("Komponen evaluasi pengasuhan");
    expect(page).toContain("Capaian karakter mahasiswa");
    expect(page).toContain("Umpan balik mahasiswa");
    expect(page).toContain("Nilai evaluasi");
    expect(page).toContain("Baik ≥ 80, Cukup 65–79,9, Kurang &lt; 65");
  });

  it("lists the eight survey statements", () => {
    const page = renderToStaticMarkup(<SurveyComponents />);

    expect(SURVEY_STATEMENTS).toHaveLength(8);
    expect(page).toContain("Pernyataan survei (8)");
    for (const statement of SURVEY_STATEMENTS) {
      expect(page).toContain(statement);
    }
  });
});
