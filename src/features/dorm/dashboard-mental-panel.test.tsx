import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DormMental } from "./dashboard-health-recap";
import { MENTAL_TOO_FEW, NOBODY_ASSESSED } from "./dashboard-health-words";
import { MentalHealthPanel } from "./dashboard-mental-panel";

const SHOWN: DormMental = {
  recap: {
    kind: "shown",
    assessed: 1200,
    byLevel: {
      normal: 900,
      mild: 200,
      moderate: 96,
      severe: "<5",
      extremely_severe: 0,
    },
  },
  sessions: "<5",
};

function render(mental: DormMental): string {
  return renderToStaticMarkup(<MentalHealthPanel mental={mental} />);
}

describe("MentalHealthPanel", () => {
  it("shows rekap anonim: a bar per level as sent, and how many are assessed and the sessions of 30 days", () => {
    const shown = render(SHOWN);

    expect(shown).toContain("Kesehatan mental penghuni");
    expect(shown).toContain("rekap anonim");
    expect(shown.match(/<meter/g)).toHaveLength(5);
    expect(shown).toContain(">&lt;5</span>");
    expect(shown).toContain(
      "1.200 penghuni sudah diasesmen · &lt;5 sesi konseling 30 hari terakhir",
    );
  });

  it("puts the line in place of the bars and the sessions while 1 to 4 residents are assessed", () => {
    const shown = render({ recap: { kind: "too_few" }, sessions: null });

    expect(shown).toContain(MENTAL_TOO_FEW);
    expect(shown).not.toContain("<meter");
    expect(shown).not.toContain("sesi konseling");
  });

  it("says nobody is assessed with none", () => {
    const shown = render({ recap: { kind: "none" }, sessions: null });

    expect(shown).toContain(NOBODY_ASSESSED);
    expect(shown).not.toContain("<meter");
  });
});
