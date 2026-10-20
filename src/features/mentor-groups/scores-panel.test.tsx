import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ScoreSummary } from "./score-averages";
import { ScoresPanel } from "./scores-panel";

const SUMMARY: ScoreSummary = {
  values: { M: 76, E: 74, D: 78, A: 72, L: 76, I: 74 },
  earlier: { M: 70, E: 70, D: 70, A: 70, L: 70, I: 70 },
  rerata: 75,
  predicates: { gold: 0, silver: 1, bronze: 1, guidance: 0 },
};

function shown(summary: ScoreSummary | null, withBar: boolean): string {
  return renderToStaticMarkup(
    <ScoresPanel title="Rerata kelompok" summary={summary} withBar={withBar} />,
  );
}

describe("ScoresPanel", () => {
  it("shows the medal with the assessment before, the Rerata and its predikat", () => {
    const panel = shown(SUMMARY, false);

    expect(panel).toContain("Rerata kelompok");
    expect(panel).toContain("75,0");
    expect(panel).toContain("Perak");
    expect(panel).toContain("Grafik nilai MEDALI: Mandiri 76");
    expect(panel).toMatch(/class="[^"]*medalLast/);
    expect(panel).not.toContain("Emas: 0");
  });

  it("shows how many members hold each predikat when asked", () => {
    expect(shown(SUMMARY, true)).toContain(
      "<title>Emas: 0, Perak: 1, Perunggu: 1, Perlu pembinaan: 0</title>",
    );
  });

  it("shows a dash and no medal when nobody is assessed", () => {
    const panel = shown(null, true);

    expect(panel).toContain("-");
    expect(panel).toContain("Belum diasesmen");
    expect(panel).not.toContain("Grafik nilai MEDALI");
  });
});
