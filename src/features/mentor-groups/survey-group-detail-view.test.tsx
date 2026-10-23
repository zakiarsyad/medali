import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SURVEY_STATEMENTS } from "@/mentoring/survey-statements";
import type { GroupSurveyDetail } from "./survey-group-detail";
import {
  GroupSurveyDetailView,
  HIDDEN_WORDS,
} from "./survey-group-detail-view";

function shown(detail: GroupSurveyDetail): string {
  return renderToStaticMarkup(
    <GroupSurveyDetailView
      detail={detail}
      groupId="kelompok-uji"
      code="KP 25-D3PJK-01"
    />,
  );
}

describe("GroupSurveyDetailView", () => {
  it("shows the average of each of the eight statements and the suggestions", () => {
    const view = shown({
      answers: 3,
      averages: [4, 4.3, 4, 3, 2.3, 4.3, 4, 3.7],
      suggestions: ["Atur jadwal lebih awal.", "Terima kasih."],
    });

    for (const statement of SURVEY_STATEMENTS) {
      expect(view).toContain(statement);
    }
    expect(view).toContain("<b>4,3</b>");
    expect(view).toContain("<b>2,3</b>");
    expect(view).toContain("Atur jadwal lebih awal.");
    expect(view).toContain("Terima kasih.");
  });

  it("links to the page of the group", () => {
    const view = shown({ answers: 0, averages: null, suggestions: null });

    expect(view).toContain(
      '<a href="/pengasuh/kelompok?kelompok=kelompok-uji">Buka kelompok KP 25-D3PJK-01</a>',
    );
  });

  it("hides the averages and the suggestions of fewer than 3 answers, with the reason", () => {
    const view = shown({ answers: 2, averages: null, suggestions: null });

    expect(HIDDEN_WORDS).toBe(
      "Disembunyikan karena responden kurang dari 3 orang, untuk menjaga kerahasiaan.",
    );
    expect(view.split(HIDDEN_WORDS)).toHaveLength(3);
    expect(view).not.toContain(SURVEY_STATEMENTS[0]);
  });

  it("says so when nobody answered, or nobody wrote a suggestion", () => {
    expect(shown({ answers: 0, averages: null, suggestions: null })).toContain(
      "Belum ada responden.",
    );
    expect(
      shown({
        answers: 3,
        averages: [4, 4, 4, 4, 4, 4, 4, 4],
        suggestions: [],
      }),
    ).toContain("Tidak ada saran tertulis.");
  });
});
