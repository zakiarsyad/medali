import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import type { PhysicalPanel } from "./dashboard-health";
import { NOBODY_TESTED, PHYSICAL_TOO_FEW } from "./dashboard-health-words";
import { PhysicalHealthPanel } from "./dashboard-physical-panel";

const NONE = { excellent: 0, good: 0, attention: 0, medical: 0 };

const SHOWN: PhysicalPanel = {
  recap: {
    kind: "shown",
    students: 120,
    tested: 110,
    untested: 10,
    byCategory: { excellent: 40, good: 50, attention: 16, medical: "<5" },
    fitShare: 82,
    illnesses: null,
  },
  byDorm: {
    wismantara_putra: NONE,
    wismantara_putri: { ...NONE, good: "<5" },
    dana_rakca: { excellent: 30, good: 40, attention: 10, medical: "<5" },
    cipta_bakti: { excellent: 10, good: 9, attention: 6, medical: 0 },
  },
  limits: STARTING_LIMITS,
};

function render(physical: PhysicalPanel): string {
  return renderToStaticMarkup(<PhysicalHealthPanel physical={physical} />);
}

describe("PhysicalHealthPanel", () => {
  it("shows how many residents are tested of all, a bar per category and each dorm's counts as sent", () => {
    const shown = render(SHOWN);

    expect(shown).toContain("Kesehatan jasmani penghuni");
    expect(shown).toContain("110 dari 120 sudah dites");
    for (const words of [
      "Prima",
      "Baik",
      "Perlu perhatian",
      "Perlu tindak lanjut medis",
    ]) {
      expect(shown).toContain(words);
    }
    expect(shown.match(/<meter/g)).toHaveLength(4);
    expect(shown).toContain(
      'data-title="Perlu tindak lanjut medis">&lt;5</td>',
    );
    expect(shown).toContain("Dana Rakca");
    expect(shown).toContain('data-title="Prima">30</td>');
  });

  it("puts the line in place of the bars and the table while 1 to 4 residents are tested", () => {
    const shown = render({
      ...SHOWN,
      recap: { kind: "too_few", students: 30 },
      byDorm: null,
    });

    expect(shown).toContain(PHYSICAL_TOO_FEW);
    expect(shown).not.toContain("<meter");
    expect(shown).not.toContain("<table");
    expect(shown).not.toContain("sudah dites<");
  });

  it("says so when no resident is tested", () => {
    const shown = render({
      ...SHOWN,
      recap: { kind: "untested", students: 30 },
      byDorm: null,
    });

    expect(shown).toContain(NOBODY_TESTED);
    expect(shown).not.toContain("<table");
  });
});
