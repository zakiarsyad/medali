import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STARTING_INDICATORS } from "@/mentoring/score-indicators";
import { IndicatorForm } from "./indicator-form";
import { STARTING_INDICATORS_VERSION } from "./indicator-set";
import { INDICATORS_READ_ONLY } from "./indicator-words";

function shownForm(): string {
  return renderToStaticMarkup(
    <IndicatorForm
      inForce={{
        indicators: STARTING_INDICATORS,
        version: STARTING_INDICATORS_VERSION,
        set: { at: new Date("2026-10-20T03:00:00Z"), by: "Kepala Uji Form" },
      }}
    />,
  );
}

describe("Indikator penilaian for Kepala Unit", () => {
  it("gives a box for the name and the sentence of each of the six, filled in with what is in force", () => {
    const page = shownForm();

    expect(page.match(/<input[^>]*name="indicator\.\d\.name"/g)).toHaveLength(
      6,
    );
    expect(
      page.match(/<textarea[^>]*name="indicator\.\d\.sentence"/g),
    ).toHaveLength(6);
    for (const indicator of STARTING_INDICATORS) {
      expect(page).toContain(`value="${indicator.name}"`);
      expect(page).toContain(`>${indicator.sentence}</textarea>`);
    }
  });

  it("offers Simpan indikator, with who set them last, and no line for those who only read", () => {
    const page = shownForm();

    expect(page).toMatch(
      /<button type="submit"[^>]*>Simpan indikator<\/button>/,
    );
    expect(page).not.toMatch(/<button[^>]*disabled[^>]*>Simpan indikator/);
    expect(page).toContain("Ditetapkan 20 Okt 2026 oleh Kepala Uji Form.");
    expect(page).not.toContain(INDICATORS_READ_ONLY);
  });

  it("carries the version of the indicators it was opened on", () => {
    expect(shownForm()).toContain(
      '<input type="hidden" name="version" value="start"/>',
    );
  });
});
