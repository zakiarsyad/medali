import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PenaltyConsequence } from "./penalty-consequence";
import type { ConsequenceChoice } from "./penalty-consequences";

const CHOICE: ConsequenceChoice = {
  category: "light",
  level: 2,
  start: "2026-10-14",
  day: "2026-10-12",
  cohortYear: 2025,
  periods: [{ startYear: 2026, term: "odd", startsOn: "2026-08-01" }],
};

function panel(
  history: Parameters<typeof PenaltyConsequence>[0]["history"],
): string {
  return renderToStaticMarkup(
    <PenaltyConsequence choice={CHOICE} isPicked history={history} />,
  );
}

describe("PenaltyConsequence", () => {
  it("says a student with no penalty has no history", () => {
    expect(panel({ count: 0, top: null })).toContain(
      "Belum ada riwayat pelanggaran",
    );
  });

  it("says how many penalties and the highest, with a warning for a lower Jenjang that does not stop the save", () => {
    const shown = panel({
      count: 2,
      top: { category: "medium", level: 1, day: "2026-09-02" },
    });
    expect(shown).toContain("Riwayat: 2 pelanggaran.");
    expect(shown).toContain("sedang jenjang pertama (2 Sep 2026)");
    expect(shown).toContain(
      "Pilihan saat ini lebih rendah dari hukuman sebelumnya. Periksa kembali sebelum menyimpan.",
    );
  });

  it("gives no warning for a Jenjang as high as the highest before", () => {
    const shown = panel({
      count: 1,
      top: { category: "light", level: 2, day: "2026-09-02" },
    });
    expect(shown).not.toContain("lebih rendah");
  });
});
