import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SurveyControls } from "./survey-controls";
import { SurveySaidAbove } from "./survey-said";

const PERIOD_ID = "00000000-0000-4000-8000-000000000025";

function shown(): string {
  return renderToStaticMarkup(
    <SurveySaidAbove>
      <SurveyControls
        periodId={PERIOD_ID}
        startsOn="2026-10-13"
        endsOn="2026-10-27"
      />
    </SurveySaidAbove>,
  );
}

describe("what Kepala Unit may do with the running survey period", () => {
  it("offers the change of the last day, closing now and cancelling", () => {
    const page = shown();

    for (const words of [
      "Ubah tanggal ditutup",
      "Simpan tanggal",
      "Tutup periode sekarang",
      "Batalkan periode",
    ]) {
      expect(page).toContain(words);
    }
  });

  it("starts the date with the last day of the period, and sends it for that period", () => {
    const page = shown();
    const field = page.match(/<input[^>]*name="endsOn"[^>]*>/)?.[0] ?? "";

    expect(field).toContain('value="2026-10-27"');
    expect(field).toContain('min="2026-10-13"');
    expect(page).toMatch(
      new RegExp(`<input[^>]*name="surveyPeriodId"[^>]*value="${PERIOD_ID}"`),
    );
  });

  it("offers no change of the weights", () => {
    expect(shown()).not.toContain("Bobot");
  });

  it("says that one period runs at a time", () => {
    expect(shown()).toContain(
      "Hanya satu periode evaluasi yang dapat dibuka pada satu waktu.",
    );
  });
});
