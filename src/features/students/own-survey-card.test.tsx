import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SURVEY_STATEMENTS } from "@/mentoring/survey-statements";
import type { OwnSurvey } from "./own-survey";
import { OwnSurveyCard } from "./own-survey-card";
import { OwnSurveyForm } from "./own-survey-form";

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

describe("OwnSurveyCard once an answer is sent", () => {
  const card = cardOf({
    ...SURVEY,
    sent: {
      scores: [5, 4, 3, 2, 1, 2, 3, 4],
      suggestion: "Lanjutkan.",
      sentAt: new Date("2026-10-21T03:05:00Z"),
      mentorName: "Pengasuh Uji Lama, M.Si.",
    },
  });

  it("shows Terkirim, the time, the mentor the answer is for and Ubah jawaban", () => {
    expect(card).toContain("Terkirim");
    expect(card).toContain(
      "Terima kasih, jawaban Anda untuk Pengasuh Uji Lama, M.Si. terkirim 21 Okt 2026, 10.05. Anda masih dapat mengubahnya sampai periode ditutup.",
    );
    expect(card).toContain("Ubah jawaban");
  });

  it("shows no form until Ubah jawaban is pressed", () => {
    expect(card).not.toContain('type="radio"');
    expect(card).not.toContain("Kirim survei");
    expect(card).not.toContain("Belum diisi");
  });
});

describe("OwnSurveyForm while a sent answer is changed", () => {
  const form = renderToStaticMarkup(
    <OwnSurveyForm
      survey={SURVEY}
      draftKey="medali:survei:uji"
      start={{ scores: [5, 4, 3, 2, 1, 2, 3, 4], suggestion: "Lanjutkan." }}
      onSent={() => {}}
      onCancel={() => {}}
    />,
  );

  it("brings the sent answers back, each score chosen, with the suggestion", () => {
    expect(form.match(/checked=""/g)).toHaveLength(8);
    expect(form).toContain("Lanjutkan.");
    expect(form).toContain("8 dari 8 pernyataan dijawab");
  });

  it("offers Batal beside Kirim survei", () => {
    expect(form).toContain("Kirim survei");
    expect(form).toContain("Batal");
  });
});
