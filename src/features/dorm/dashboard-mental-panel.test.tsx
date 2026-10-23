import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DormMental, DormPublishedRow } from "./dashboard-health-recap";
import {
  MENTAL_TOO_FEW,
  NOBODY_ASSESSED,
  NOTHING_PUBLISHED,
  PUBLISHED_HEADING,
} from "./dashboard-health-words";
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
  published: [],
};

const ROW: DormPublishedRow = {
  studentId: "00000000-0000-4000-8000-000000000001",
  publishedAt: new Date("3913-10-10T03:00:00Z"),
  name: "Penghuni Contoh",
  mentorName: "Pengasuh Contoh",
  room: "Dana Rakca, lantai 1, kamar 12",
  data: ["level", "summary"],
  level: "moderate",
  sessions: null,
  summary: "Mahasiswa sedang dalam pendampingan rutin.",
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
    const shown = render({
      recap: { kind: "too_few" },
      sessions: null,
      published: [],
    });

    expect(shown).toContain(MENTAL_TOO_FEW);
    expect(shown).not.toContain("<meter");
    expect(shown).not.toContain("sesi konseling");
  });

  it("says nobody is assessed with none", () => {
    const shown = render({
      recap: { kind: "none" },
      sessions: null,
      published: [],
    });

    expect(shown).toContain(NOBODY_ASSESSED);
    expect(shown).not.toContain("<meter");
  });

  it("lists each resident published to the viewer with the name, the room and what was shared, and no Pengasuh", () => {
    const shown = render({ ...SHOWN, published: [ROW] });

    expect(shown).toContain(PUBLISHED_HEADING);
    expect(shown).toContain("Penghuni Contoh");
    expect(shown).toContain("Sedang");
    expect(shown).toContain(
      "Dana Rakca, lantai 1, kamar 12 · Mahasiswa sedang dalam pendampingan rutin.",
    );
    expect(shown).not.toContain("Pengasuh Contoh");
    expect(shown).not.toContain(NOTHING_PUBLISHED);
  });

  it("says data on one person shows only when the counsellor shares it, with nothing published", () => {
    const shown = render(SHOWN);

    expect(shown).toContain(PUBLISHED_HEADING);
    expect(shown).toContain(NOTHING_PUBLISHED);
  });

  it("keeps the published list while the counts are held back", () => {
    const shown = render({
      recap: { kind: "too_few" },
      sessions: null,
      published: [ROW],
    });

    expect(shown).toContain(MENTAL_TOO_FEW);
    expect(shown).toContain("Penghuni Contoh");
  });
});
