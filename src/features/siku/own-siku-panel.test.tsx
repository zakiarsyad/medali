import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OwnEntry, OwnSiku } from "./own-siku";
import { OwnSikuPanel } from "./own-siku-panel";
import { HELD_WITHIN } from "./siku-breakdown";

function entryOf(place: number, more: Partial<OwnEntry> = {}): OwnEntry {
  return {
    id: `00000000-0000-4000-8000-${String(place).padStart(12, "0")}`,
    day: `2026-10-${String(place).padStart(2, "0")}`,
    kind: "gain",
    reason: "peer_mentoring",
    points: 2,
    note: "Tutor sebaya",
    basis: "",
    enteredAs: "assessor",
    fromFile: false,
    fromRequest: false,
    ...more,
  };
}

const SIKU: OwnSiku = {
  totals: { gains: 2, losses: 3 },
  entries: [
    entryOf(2),
    entryOf(1, { kind: "loss", reason: "student_violation", points: 3 }),
  ],
};

function panelOf(siku: OwnSiku, base = 65): string {
  return renderToStaticMarkup(
    <OwnSikuPanel base={base} weight={25} siku={siku} />,
  );
}

describe("Transparansi nilai SIKU", () => {
  it("shows its weight in the grade, the sum and each line with the role that entered it", () => {
    const html = panelOf(SIKU);

    expect(html).toContain("Transparansi nilai SIKU");
    expect(html).toContain("bobot 25% pada nilai karakter");
    expect(html).toContain("Penambahan (1)");
    expect(html).toContain("Pengurangan (1)");
    expect(html).toContain("<b>64</b>");
    expect(html).toContain("Melakukan pembimbingan mahasiswa lain");
    expect(html).toContain("Pelanggaran mahasiswa");
    expect(html).toContain("Penilai Mahasiswa");
    expect(html).not.toContain(HELD_WITHIN);
  });

  it("says when SIKU akhir was held within 0–100, and when a table has no line", () => {
    const html = panelOf(
      {
        totals: { gains: 40, losses: 0 },
        entries: [entryOf(1, { points: 40 })],
      },
      70,
    );

    expect(html).toContain(HELD_WITHIN);
    expect(html).toContain("Belum ada pengurangan.");
  });

  it("shows the first 10 lines of a table and folds the rest", () => {
    const entries = Array.from({ length: 12 }, (_, place) =>
      entryOf(12 - place),
    );
    const html = panelOf({ totals: { gains: 24, losses: 0 }, entries });

    expect(html).toContain("Tampilkan semua (12)");
  });

  it("folds the activities, the reasons for a loss and who to contact", () => {
    const html = panelOf(SIKU);
    const folded = html.slice(html.indexOf("<details"));

    expect(folded).toMatch(
      /^<details[^>]*><summary[^>]*>Kegiatan yang dapat menambah nilai SIKU<\/summary>/,
    );
    expect(folded).toContain("Aktif dalam kegiatan spiritual");
    expect(folded).toContain("Pengurangan dapat terjadi karena: pelanggaran");
    expect(folded).toContain(
      "Bila ada catatan yang menurut Anda keliru, hubungi pengasuh atau Penilai Mahasiswa.",
    );
  });
});
