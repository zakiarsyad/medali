import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SURVEY_STATEMENTS } from "@/mentoring/survey-statements";
import type { OwnSurvey } from "./own-survey";
import { OwnSurveyCard } from "./own-survey-card";

const SURVEY: OwnSurvey = {
  surveyPeriodId: "00000000-0000-4000-8000-000000000101",
  periodTitle: "Ganjil 2026/2027",
  endsOn: "2026-11-03",
  mentorId: "00000000-0000-4000-8000-000000000102",
  mentorName: "Pengasuh Uji Kartu, M.Psi.",
  sent: null,
};

function cardOf(survey: OwnSurvey): string {
  return renderToStaticMarkup(
    <OwnSurveyCard survey={survey} draftKey="medali:survei:uji" />,
  );
}

describe("OwnSurveyCard before anything is sent", () => {
  const card = cardOf(SURVEY);

  it("shows the title, the period with its last day, the mentor and Belum diisi", () => {
    expect(card).toContain("Survei kepuasan pengasuhan");
    expect(card).toContain(
      "Periode evaluasi Ganjil 2026/2027 · dibuka sampai 3 Nov 2026",
    );
    expect(card).toContain("Pengasuh Uji Kartu, M.Psi.");
    expect(card).toContain("Belum diisi");
  });

  it("shows the eight statements, each with the buttons 1 to 5", () => {
    for (const statement of SURVEY_STATEMENTS) {
      expect(card).toContain(statement);
    }
    expect(card.match(/type="radio"/g)).toHaveLength(40);
    expect(card.match(/<fieldset/g)).toHaveLength(8);
  });

  it("shows the key, the suggestion of up to 600 characters, the count and Kirim survei", () => {
    expect(card).toContain("1 = Sangat tidak setuju");
    expect(card).toContain("5 = Sangat setuju");
    expect(card).toContain("Saran untuk pengasuh (opsional)");
    expect(card).toContain('maxLength="600"');
    expect(card).toContain("0 dari 8 pernyataan dijawab");
    expect(card).toContain("Kirim survei");
    expect(card).not.toContain("Batal");
  });

  it("says that answers are not shown per person", () => {
    expect(card).toContain("tidak ditampilkan per orang");
  });
});
