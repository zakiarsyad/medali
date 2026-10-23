import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DormId } from "@/dorms/dorms";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import type { PhysicalPanel } from "./dashboard-health";
import type { CareRow, DormCategories } from "./dashboard-health-recap";
import {
  CARE_HEADING,
  DORM_HELD_BACK,
  NOBODY_NEEDS_CARE,
  NOBODY_TESTED,
  PHYSICAL_TOO_FEW,
} from "./dashboard-health-words";
import { PhysicalHealthPanel } from "./dashboard-physical-panel";

const NONE = { excellent: 0, good: 0, attention: 0, medical: 0 };

const BY_DORM: Record<DormId, DormCategories | null> = {
  wismantara_putra: NONE,
  wismantara_putri: null,
  dana_rakca: { excellent: 30, good: 40, attention: 10, medical: "<5" },
  cipta_bakti: { excellent: 10, good: 9, attention: 6, medical: 0 },
};

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
  byDorm: BY_DORM,
  limits: STARTING_LIMITS,
  care: null,
};

const CARE: CareRow[] = [
  {
    id: "s1",
    name: "Penghuni Contoh Satu",
    room: "Dana Rakca, lantai 1, kamar 12",
    final: { category: "medical", fromNote: false },
    note: null,
  },
  {
    id: "s2",
    name: "Penghuni Contoh Dua",
    room: "Dana Rakca, belum diplot",
    final: { category: "attention", fromNote: true },
    note: "Riwayat: Asma. Kontrol rutin.",
  },
];

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

  it("writes a count sent as 5+ as it is, with no bar for it", () => {
    const shown = render({
      ...SHOWN,
      recap: {
        kind: "shown",
        students: 120,
        tested: 110,
        untested: 10,
        byCategory: { excellent: 40, good: "5+", attention: 16, medical: "<5" },
        fitShare: null,
        illnesses: null,
      },
      byDorm: {
        ...BY_DORM,
        dana_rakca: { excellent: "5+", good: 40, attention: 10, medical: "<5" },
      },
    });

    expect(shown).toContain('value="0" aria-label="Baik"');
    expect(shown).toContain('data-title="Prima">5+</td>');
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

  it("shows – in each category of a dorm held back, and says why once", () => {
    const shown = render(SHOWN);

    const row = shown.slice(
      shown.indexOf("Wismantara Putri"),
      shown.indexOf("</tr>", shown.indexOf("Wismantara Putri")),
    );
    expect(row.match(/>–<\/td>/g)).toHaveLength(4);
    expect(shown).toContain(DORM_HELD_BACK);
  });

  it("says nothing of a held-back dorm when every dorm shows its counts", () => {
    const shown = render({
      ...SHOWN,
      byDorm: { ...BY_DORM, wismantara_putri: NONE },
    });

    expect(shown).not.toContain(DORM_HELD_BACK);
    expect(shown).not.toContain(">–<");
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

  it("shows each resident who needs care with the category, the room and the last note, and a link to Kesehatan", () => {
    const shown = render({ ...SHOWN, care: CARE });

    expect(shown).toContain(CARE_HEADING);
    expect(shown).toContain("Penghuni Contoh Satu");
    expect(shown).toContain("Dana Rakca, lantai 1, kamar 12");
    expect(shown).toContain("Belum ada catatan kesehatan.");
    expect(shown).toContain("Riwayat: Asma. Kontrol rutin.");
    expect(shown).toContain("berdasarkan catatan kesehatan");
    expect(shown).toContain('href="/asrama/sehat"');
    expect(shown.indexOf("Penghuni Contoh Satu")).toBeLessThan(
      shown.indexOf("Penghuni Contoh Dua"),
    );
  });

  it("says Tidak ada. with nobody who needs care, and keeps the link", () => {
    const shown = render({ ...SHOWN, care: [] });

    expect(shown).toContain(CARE_HEADING);
    expect(shown).toContain(`>${NOBODY_NEEDS_CARE}<`);
    expect(shown).toContain('href="/asrama/sehat"');
  });

  it("shows no part of names, notes or the link to an account without the right to them", () => {
    const shown = render(SHOWN);

    expect(shown).not.toContain(CARE_HEADING);
    expect(shown).not.toContain("/asrama/sehat");
  });
});
