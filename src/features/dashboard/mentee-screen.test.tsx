import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { STARTING_SCHEME } from "@/character-grades/scheme-ids";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import { DashboardSwitch } from "./dashboard-switch";
import { NO_GRADES } from "./grade-words";
import type { MenteeDashboard } from "./mentee-recap";
import { MenteeScreen } from "./mentee-screen";
import {
  MENTEES_NOT_ASSESSED,
  NO_GROUP_HELD,
  NO_MENTEES,
} from "./mentee-words";
import { NOBODY_TESTED } from "./physical-words";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

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
    published: {
      matching: 1,
      needCounselling: 1,
      rows: [
        {
          studentId: "00000000-0000-4000-8000-000000000001",
          publishedAt: new Date("2026-10-21T03:00:00Z"),
          name: "Mahasiswa Contoh",
          mentorName: "Pengasuh Contoh",
          data: ["level", "summary"],
          level: "moderate",
          sessions: null,
          summary: "Pendampingan rutin.",
        },
      ],
    },
  },
  fitnessLimits: STARTING_LIMITS,
  penalties: [],
  members: [
    {
      studentId: "00000000-0000-4000-8000-000000000003",
      name: "Mahasiswa Rendah",
      nim: "9900000003",
      className: "1-02",
      semester: 3,
      scores: { M: 60, E: 70, D: 60, A: 60, L: 60, I: 60 },
      opensDetail: true,
    },
    {
      studentId: "00000000-0000-4000-8000-000000000004",
      name: "Mahasiswa Baru",
      nim: "9900000004",
      className: null,
      semester: null,
      scores: null,
      opensDetail: false,
    },
  ],
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
  fitness: "/penilaian/jasmani",
  mental: "/penilaian/mental",
  penalties: "/pembinaan/disiplin",
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
      "1 perlu konseling. Hanya data yang disetujui mahasiswa.",
    );
    expect(html).not.toContain("diasesmen</small>");
    expect(html).not.toContain("Filter");
  });

  it("moves the page to each section when its card is pressed", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain('href="#capaian-karakter"');
    expect(html).toContain('id="capaian-karakter"');
    expect(html).toContain('href="#nilai-karakter"');
    expect(html).toContain('id="nilai-karakter"');
    expect(html).toContain('href="#kesehatan-jasmani"');
    expect(html).toContain('id="kesehatan-jasmani"');
    expect(html).toContain('href="#kesehatan-mental"');
    expect(html).toContain('id="kesehatan-mental"');
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

  it("shows section 3 for the anak asuh with the illnesses of even a few, and Arti kategori", () => {
    const view: MenteeDashboard = {
      ...SHOWN,
      cards: {
        ...SHOWN.cards,
        physical: {
          kind: "shown",
          students: 12,
          tested: 2,
          untested: 10,
          byCategory: { excellent: 0, good: 0, attention: 1, medical: 1 },
          fitShare: 0,
          illnesses: [{ illness: "asthma", students: 2 }],
        },
      },
    };

    const html = renderToStaticMarkup(
      <MenteeScreen view={view} links={LINKS} />,
    );
    const empty = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain(
      "Kategori kesehatan fisik anak asuh dari uji kesehatan dan riwayat penyakit.",
    );
    expect(html).toContain("Kategori tes kebugaran");
    expect(html).toContain("2 dari 12 sudah dites");
    expect(html).toContain("Asma (2)");
    expect(html).toContain("Arti kategori");
    expect(html).toMatch(/href="\/penilaian\/jasmani"[^>]*>Lihat rincian</);
    expect(empty).toContain(NOBODY_TESTED);
  });

  it("shows in section 4 only Kesehatan mental anak asuh, without the Pengasuh's own name or an anonymous count", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain(
      "Hanya data yang dipublikasikan konselor dengan persetujuan anak asuh.",
    );
    expect(html).toContain("Kesehatan mental anak asuh");
    expect(html).toContain("Mahasiswa Contoh");
    expect(html).toContain("Pendampingan rutin.");
    expect(html).not.toContain("Pengasuh Contoh");
    expect(html).not.toContain("rekap anonim");
    expect(html).toMatch(/href="\/penilaian\/mental"[^>]*>Lihat rincian</);
  });

  it("says so in section 4 while nothing about the anak asuh is published", () => {
    const view: MenteeDashboard = {
      ...SHOWN,
      cards: {
        ...SHOWN.cards,
        published: { matching: 0, needCounselling: 0, rows: [] },
      },
    };

    const html = renderToStaticMarkup(
      <MenteeScreen view={view} links={LINKS} />,
    );

    expect(html).toContain(
      "Belum ada data yang dipublikasikan konselor untuk anak asuh Anda. Data hanya tampil dengan persetujuan mahasiswa.",
    );
  });

  it("shows Pelanggaran disiplin with each penalty and Lihat semua, or not at all without one", () => {
    const view: MenteeDashboard = {
      ...SHOWN,
      penalties: [
        {
          id: "p1",
          studentId: "00000000-0000-4000-8000-000000000002",
          name: "Mahasiswa Pelanggar",
          opensDetail: true,
          day: "2026-10-01",
          category: "light",
          level: 1,
          description: "Terlambat apel pagi.",
        },
      ],
    };

    const html = renderToStaticMarkup(
      <MenteeScreen view={view} links={LINKS} />,
    );
    const none = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain("Pelanggaran disiplin</h3>");
    expect(html).toContain("1 Okt 2026");
    expect(html).toMatch(
      /href="\/dashboard\?tampilan=anak-asuh&amp;profil=00000000-0000-4000-8000-000000000002"[^>]*>Mahasiswa Pelanggar</,
    );
    expect(html).toContain("Ringan · jenjang pertama");
    expect(html).toContain("Terlambat apel pagi.");
    expect(html).toMatch(/href="\/pembinaan\/disiplin"[^>]*>Lihat semua</);
    expect(none).not.toContain("Pelanggaran disiplin</h3>");
  });

  it("lists the anak asuh with their scores, each opening the student detail", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={SHOWN} links={LINKS} />,
    );

    expect(html).toContain('id="anak-asuh"');
    expect(html).toContain(
      "Capaian MEDALI tiap anak asuh, diurutkan dari rerata terendah. Pilih nama untuk melihat profil lengkap.",
    );
    expect(html).toMatch(
      /href="\/dashboard\?tampilan=anak-asuh&amp;profil=00000000-0000-4000-8000-000000000003"[^>]*><b>Mahasiswa Rendah<\/b>/,
    );
    expect(html).toContain("9900000003");
    expect(html).toContain('data-title="Kelas akademik">1-02<');
    expect(html).toContain('data-title="Semester">3<');
    expect(html).toContain("61,7");
    expect(html).toContain("Perlu pembinaan");
    expect(html).toContain("<b>Mahasiswa Baru</b>");
    expect(html).toContain("Belum diasesmen");
    expect(html).not.toContain("profil=00000000-0000-4000-8000-000000000004");
  });

  it("says so in the table while the group holds no Aktif anak asuh", () => {
    const html = renderToStaticMarkup(
      <MenteeScreen view={{ ...SHOWN, members: [] }} links={LINKS} />,
    );

    expect(html).toContain(NO_MENTEES);
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
