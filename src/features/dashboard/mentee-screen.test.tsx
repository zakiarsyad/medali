import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STARTING_SCHEME } from "@/character-grades/scheme-ids";
import { DashboardSwitch } from "./dashboard-switch";
import { NO_GRADES } from "./grade-words";
import type { MenteeDashboard } from "./mentee-recap";
import { MenteeScreen } from "./mentee-screen";
import { MENTEES_NOT_ASSESSED, NO_GROUP_HELD } from "./mentee-words";

const SHOWN: MenteeDashboard = {
  kind: "shown",
  students: 12,
  groups: [
    {
      id: "a",
      cohortYear: 2026,
      entryPath: "regular",
      number: 1,
      programCode: "D3PJK",
    },
  ],
  progress: null,
  cards: {
    achievement: {
      students: 12,
      assessed: 1,
      rerata: 90,
      spread: { gold: 1, silver: 0, bronze: 0, guidance: 0 },
      averages: { M: 90, E: 90, D: 90, A: 90, L: 90, I: 90 },
      change: null,
    },
    grades: { recap: { kind: "none" }, scheme: STARTING_SCHEME },
    physical: { kind: "untested", students: 12 },
    published: { matching: 3, needCounselling: 2 },
  },
  attention: [],
  notes: [],
  noteNumbers: {
    recentNotes: 4,
    openCoaching: 2,
    penalties: 1,
    attendance: null,
  },
};

const LINKS = {
  assessment: "/penilaian/asesmen",
  grade: "/penilaian/karakter",
  meetings: "/pengasuhan/hadir",
  scores: "/pengasuhan/nilai",
  notes: "/pengasuhan/catatan",
};

describe("Dashboard anak asuh", () => {
  it("shows the title and the line of a Pengasuh with a group", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain("Dashboard anak asuh");
    expect(html).toContain(
      "Empat aspek penilaian 12 anak asuh Anda di KP 26-D3PJK-01, angkatan 2026.",
    );
  });

  it("shows the four cards, Kesehatan mental by what is published to the Pengasuh", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain("Hasil asesmen 1 dari 12 mahasiswa.");
    expect(html).toContain("Nilai karakter");
    expect(html).toContain("Belum ada hasil tes kebugaran dari 12 mahasiswa.");
    expect(html).toContain("dipublikasikan");
    expect(html).toContain(
      "2 perlu konseling. Hanya data yang disetujui mahasiswa.",
    );
    expect(html).not.toContain("diasesmen</small>");
    expect(html).not.toContain("Filter");
  });

  it("moves the page to section 1 or 2 when its card is pressed", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain('href="#capaian-karakter"');
    expect(html).toContain('id="capaian-karakter"');
    expect(html).toContain('href="#nilai-karakter"');
    expect(html).toContain('id="nilai-karakter"');
  });

  it("shows section 1 for the anak asuh, with Lihat rincian to Asesmen karakter and no table per angkatan", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain("Nilai MEDALI hasil asesmen anak asuh.");
    expect(html).toContain("Semester pertama");
    expect(html).toContain("Rerata 90,0 · Emas");
    expect(html).toContain("1 dari 12 mahasiswa sudah diasesmen.");
    expect(html).toMatch(/href="\/penilaian\/asesmen"[^>]*>Lihat rincian</);
    expect(html).not.toContain("per angkatan");
  });

  it("says so in section 1 and its card, not zeros, while no anak asuh is assessed", () => {
    const view = {
      ...SHOWN,
      cards: { ...SHOWN.cards, achievement: null },
    };
    const html = renderToStaticMarkup(
      <MenteeScreen view={view} links={LINKS} />,
    );

    expect(html.split(MENTEES_NOT_ASSESSED)).toHaveLength(3);
    expect(html).not.toContain("minimal 5");
  });

  it("shows section 2 for the anak asuh, or says there is no grade yet", () => {
    const graded: MenteeDashboard = {
      ...SHOWN,
      cards: {
        ...SHOWN.cards,
        grades: {
          scheme: STARTING_SCHEME,
          recap: {
            kind: "shown",
            graded: 2,
            limited: 0,
            meanFinal: 81.5,
            passing: 100,
            letters: { A: 1, B: 1, C: 0, D: 0, E: 0 },
            incomplete: 0,
            parts: { attendance: 90, mentoring: 80, siku: 75, skpm: 70 },
          },
        },
      },
    };

    const html = renderToStaticMarkup(
      <MenteeScreen view={graded} links={LINKS} />,
    );
    const empty = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain("Komponen nilai karakter");
    expect(html).toContain("Sebaran huruf");
    expect(html).toMatch(/href="\/penilaian\/karakter"[^>]*>Lihat rincian</);
    expect(html).not.toContain("per angkatan");
    expect(empty).toContain(NO_GRADES);
    expect(empty).not.toContain("Komponen nilai karakter");
  });

  it("shows Catatan pengasuhan terbaru with Tulis catatan and its four numbers", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toMatch(/href="\/pengasuhan\/catatan"[^>]*>Tulis catatan</);
    expect(html).toContain("Belum ada catatan.");
    expect(html).toContain("<dt>Catatan 30 hari</dt><dd>4</dd>");
    expect(html).toContain("<dt>Perlu pembinaan</dt><dd>2</dd>");
    expect(html).toContain("<dt>Pelanggaran disiplin</dt><dd>1</dd>");
    expect(html).toContain("<dt>Rerata kehadiran kegiatan</dt><dd>-</dd>");
    expect(html).toContain("Tidak ada anak asuh yang perlu perhatian");
  });

  it("shows only the message to a Pengasuh without a group", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={{ kind: "no_group" }} links={LINKS} />,
    );

    expect(html).toContain("Dashboard anak asuh");
    expect(html).toContain(NO_GROUP_HELD);
    expect(html).not.toContain("Empat aspek");
  });
});

describe("the switch between the two Dashboards", () => {
  it("leads to each view, the open one marked", () => {
    const html = renderToStaticMarkup(
      <DashboardSwitch kinds={["character", "mentees"]} open="mentees" />,
    );

    expect(html).toContain('href="/dashboard?tampilan=karakter"');
    expect(html).toContain("Dashboard pembangunan karakter");
    expect(html).toContain('href="/dashboard?tampilan=anak-asuh"');
    expect(html).toMatch(
      /<a[^>]*aria-current="page"[^>]*>Dashboard anak asuh</,
    );
  });

  it("does not show for an account with one view", () => {
    expect(
      renderToStaticMarkup(
        <DashboardSwitch kinds={["mentees"]} open="mentees" />,
      ),
    ).toBe("");
  });
});
