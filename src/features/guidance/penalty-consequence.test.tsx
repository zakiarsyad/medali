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
  choice: ConsequenceChoice = CHOICE,
): string {
  return renderToStaticMarkup(
    <PenaltyConsequence choice={choice} isPicked history={history} />,
  );
}

const SILVER = { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 };

describe("PenaltyConsequence", () => {
  it("says a student with no penalty has no history", () => {
    expect(panel({ count: 0, top: null, latest: null })).toContain(
      "Belum ada riwayat pelanggaran",
    );
  });

  it("says how many penalties and the highest, with a warning for a lower Jenjang that does not stop the save", () => {
    const shown = panel({
      count: 2,
      top: { category: "medium", level: 1, day: "2026-09-02" },
      latest: null,
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
      latest: null,
    });
    expect(shown).not.toContain("lebih rendah");
  });

  it("shows for Ringan or Sedang the Rerata before and after the cap, with the medal held at 70 over the one as stored", () => {
    const shown = panel({ count: 0, top: null, latest: SILVER });

    expect(shown).toContain(
      "Dibatasi paling tinggi 70. Rerata 80,3 menjadi 70,0 (Perunggu).",
    );
    expect(shown).toContain(
      "Grafik nilai MEDALI: Mandiri 70, Empati 70, Disiplin 70, Adaptif 70, Loyal 70, Integritas 70",
    );
    expect(shown).toMatch(/class="[^"]*medalLast/);
    expect(shown).toContain(
      "Garis putus-putus menunjukkan skor sebelum pembatasan.",
    );
  });

  it("shows no medal for Berat, and none for a student never assessed", () => {
    const heavy = panel(
      { count: 0, top: null, latest: SILVER },
      { ...CHOICE, category: "heavy", level: 1 },
    );
    const fresh = panel({ count: 0, top: null, latest: null });

    expect(heavy).not.toContain("Grafik nilai MEDALI");
    expect(fresh).not.toContain("Grafik nilai MEDALI");
    expect(fresh).toContain("Dibatasi paling tinggi 70.");
  });
});
