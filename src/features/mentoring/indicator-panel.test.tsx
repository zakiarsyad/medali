import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STARTING_INDICATORS } from "@/mentoring/score-indicators";
import { IndicatorPanel } from "./indicator-panel";
import { STARTING_INDICATORS_VERSION } from "./indicator-version";
import { INDICATORS_READ_ONLY, STARTING_NOTE } from "./indicator-words";

const STARTING = {
  indicators: STARTING_INDICATORS,
  version: STARTING_INDICATORS_VERSION,
  set: null,
};

function shownFor(inForce: Parameters<typeof IndicatorPanel>[0]["inForce"]) {
  return renderToStaticMarkup(<IndicatorPanel inForce={inForce} />);
}

describe("IndicatorPanel, read only", () => {
  it("shows the six indicators with name and sentence, in their order", () => {
    const shown = shownFor(STARTING);

    expect(shown).toContain("Indikator penilaian");
    let from = 0;
    for (const indicator of STARTING_INDICATORS) {
      const at = shown.indexOf(indicator.name, from);
      expect(at).toBeGreaterThan(from);
      expect(shown).toContain(indicator.sentence);
      from = at;
    }
  });

  it("shows what each number means, from 1 Sangat kurang to 5 Sangat baik", () => {
    const shown = shownFor(STARTING);

    for (const [score, meaning] of [
      ["1", "Sangat kurang"],
      ["2", "Kurang"],
      ["3", "Cukup"],
      ["4", "Baik"],
      ["5", "Sangat baik"],
    ]) {
      expect(shown).toContain(`<dt class="`);
      expect(shown).toMatch(
        new RegExp(`>${score}</dt><dd[^>]*>${meaning}</dd>`),
      );
    }
  });

  it("says the indicators are the starting ones while nobody has set them", () => {
    expect(shownFor(STARTING)).toContain(STARTING_NOTE);
  });

  it("says who set the indicators last and when", () => {
    const shown = shownFor({
      ...STARTING,
      set: { at: new Date("2026-10-20T03:00:00Z"), by: "Kepala Uji Panel" },
    });

    expect(shown).toContain("Ditetapkan 20 Okt 2026 oleh Kepala Uji Panel.");
    expect(shown).not.toContain(STARTING_NOTE);
  });

  it("says who sets them, with nothing to change and nothing to send", () => {
    const shown = shownFor(STARTING);

    expect(INDICATORS_READ_ONLY).toBe(
      "Indikator penilaian ditetapkan oleh Kepala Unit Pembangunan Karakter.",
    );
    expect(shown).toContain(INDICATORS_READ_ONLY);
    expect(shown).not.toContain("<input");
    expect(shown).not.toContain("<form");
    expect(shown).not.toContain("<button");
  });
});
