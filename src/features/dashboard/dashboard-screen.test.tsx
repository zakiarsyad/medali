import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { STARTING_SCHEME } from "@/character-grades/scheme-ids";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import type { Recap } from "./achievement-recap";
import { TOO_FEW } from "./achievement-words";
import { NO_FILTERS } from "./dashboard-address";
import { DashboardScreen, type DetailLinks } from "./dashboard-screen";
import type { DashboardView } from "./dashboard-view";
import type { ShownGrades } from "./grade-recap";
import { NO_GRADES } from "./grade-words";
import { PHYSICAL_TOO_FEW } from "./physical-words";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const SCORES = { M: 81, E: 79, D: 84, A: 76, L: 80, I: 83 };

const RECAP: Recap = {
  students: 40,
  assessed: 30,
  rerata: 80.5,
  spread: { gold: 7, silver: 15, bronze: 6, guidance: 2 },
  averages: SCORES,
  change: null,
};

const GRADES: ShownGrades = {
  kind: "shown",
  graded: 36,
  limited: 2,
  meanFinal: 78.4,
  passing: 81,
  letters: { A: 9, B: 20, C: 4, D: 0, E: 3 },
  incomplete: 5,
  parts: { attendance: 88.24, mentoring: 80, siku: 75.5, skpm: 61 },
};

function viewOf(more: Partial<DashboardView> = {}): DashboardView {
  return {
    filters: NO_FILTERS,
    programs: [{ id: 1, name: "D3 Pajak" }],
    stagesShown: true,
    period: { startYear: 2026, term: "odd" },
    held: { cohortYears: [2025], provinces: ["Bali"], agencies: [] },
    counts: {
      matching: 40,
      stages: new Map([[2, 40]]),
      programs: new Map([[1, 40]]),
      entryPaths: new Map([["regular", 40]]),
      provinces: new Map([["Bali", 40]]),
      affirmation: new Map([[false, 40]]),
      seedling: new Map([[false, 40]]),
      international: new Map([[false, 40]]),
      agencies: new Map([["tanpa", 40]]),
    },
    achievement: {
      recap: RECAP,
      cohorts: [{ cohortYear: 2025, entryPath: "regular", recap: RECAP }],
    },
    grades: { scheme: STARTING_SCHEME, recap: GRADES },
    physical: {
      kind: "shown",
      students: 40,
      tested: 30,
      untested: 10,
      byCategory: { excellent: 12, good: 9, attention: 6, medical: "<5" },
      fitShare: 70,
      illnesses: null,
    },
    fitnessLimits: STARTING_LIMITS,
    ...more,
  };
}

const NO_LINKS = { assessment: null, grade: null, fitness: null };
const LINKS = {
  assessment: "/penilaian/asesmen",
  grade: "/penilaian/karakter",
  fitness: "/penilaian/jasmani",
};

function shown(view: DashboardView, links: DetailLinks = NO_LINKS) {
  return renderToStaticMarkup(<DashboardScreen view={view} links={links} />);
}

/** What the page shows from section 3 on, where section 2's bars are not. */
function sectionThree(html: string): string {
  return html.slice(html.indexOf('id="kesehatan-jasmani"'));
}

describe("DashboardScreen", () => {
  it("shows the filter, the card, section 1 and the cohorts", () => {
    const html = shown(viewOf(), LINKS);

    expect(html).toContain("Dashboard pembangunan karakter");
    for (const label of [
      "Tahapan",
      "Program studi",
      "Reguler atau alih program",
      "Provinsi",
      "Afirmasi",
      "Pembibitan",
      "Internasional",
      "Instansi",
    ]) {
      expect(html).toContain(`${label}<select`);
    }
    expect(html).not.toContain("Asrama");
    expect(html).toContain("mahasiswa aktif");
    expect(html).toContain('href="#capaian-karakter"');
    expect(html).toContain(
      "Hasil asesmen 30 dari 40 mahasiswa. 7 emas, 2 perlu pembinaan.",
    );
    expect(html).toContain("Rerata 80,5 · Perak");
    expect(html).toContain("Semester pertama");
    expect(html).toContain('href="/penilaian/asesmen"');
    expect(html).toContain("Angkatan 2025");
    expect(html).toContain("Reguler · Smt 3");
  });

  it("shows the card Nilai karakter between Capaian karakter and Kesehatan jasmani, leading to section 2", () => {
    const html = shown(viewOf());
    const card = html.indexOf('href="#nilai-karakter"');

    expect(card).toBeGreaterThan(html.indexOf('href="#capaian-karakter"'));
    expect(card).toBeLessThan(html.indexOf('href="#kesehatan-jasmani"'));
    expect(html).toContain("78,4 <small>nilai akhir</small>");
    expect(html).toContain("81% memenuhi minimal B. 2 dibatasi 70.");
    expect(html).toContain(
      'aria-label="Huruf A 9, Huruf B 20, Huruf C 4, Huruf D 0, Huruf E 3"',
    );
  });

  it("shows only why there are no grade numbers on the card for a small or ungraded group", () => {
    const tooFew = shown(
      viewOf({
        grades: { scheme: STARTING_SCHEME, recap: { kind: "too_few" } },
      }),
    );
    const none = shown(
      viewOf({ grades: { scheme: STARTING_SCHEME, recap: { kind: "none" } } }),
    );

    expect(tooFew).toContain(TOO_FEW);
    expect(tooFew).not.toContain("nilai akhir");
    expect(none).toContain(NO_GRADES);
    expect(none).not.toContain("nilai akhir");
    expect(none).not.toContain("Huruf A");
  });

  it("shows section 2 between sections 1 and 3, with each part and its weight, the letters and Lihat rincian to Penilaian karakter", () => {
    const html = shown(viewOf(), LINKS);
    const section = html.indexOf('id="nilai-karakter"');

    expect(section).toBeGreaterThan(html.indexOf('id="capaian-karakter"'));
    expect(section).toBeLessThan(html.indexOf('id="kesehatan-jasmani"'));
    expect(html).toContain("Komponen nilai karakter");
    expect(html).toContain("rerata, bobot dalam kurung");
    expect(html).toMatch(
      /Kehadiran kegiatan \(25%\)<\/span><meter[^>]*><\/meter><span[^>]*>88,2</,
    );
    expect(html).toContain("Pengasuhan (25%)");
    expect(html).toContain("Sikap dan perilaku (SIKU) (25%)");
    expect(html).toContain("SKPM (25%)");
    expect(html).toContain("<dt>Rerata nilai akhir</dt><dd>78,4</dd>");
    expect(html).toContain("<dt>Memenuhi minimal B</dt><dd>81%</dd>");
    expect(html).toContain(
      "Kehadiran dihitung otomatis dari presensi kegiatan karakter. 2 mahasiswa nilainya dibatasi 70 karena hukuman disiplin.",
    );
    expect(html).toContain("Sebaran huruf");
    expect(html).toContain("36 mahasiswa");
    expect(html).toMatch(/Huruf B<\/span><meter/);
    expect(html).toMatch(/Huruf C<span[^>]*> \(belum lulus\)<\/span>/);
    expect(html).toContain("5 belum lengkap, tidak dihitung.");
    expect(html).toContain('href="/penilaian/karakter"');
  });

  it("shows only why there are no grade numbers in section 2 for a small or ungraded group", () => {
    const tooFew = shown(
      viewOf({
        grades: { scheme: STARTING_SCHEME, recap: { kind: "too_few" } },
        achievement: { recap: RECAP, cohorts: [] },
      }),
    );
    const none = shown(
      viewOf({ grades: { scheme: STARTING_SCHEME, recap: { kind: "none" } } }),
    );

    expect(tooFew.split(TOO_FEW)).toHaveLength(3);
    expect(none.split(NO_GRADES)).toHaveLength(3);
    for (const html of [tooFew, none]) {
      expect(html).toContain('id="nilai-karakter"');
      expect(html).not.toContain("Komponen nilai karakter");
      expect(html).not.toContain("Sebaran huruf");
    }
  });

  it("shows the card Kesehatan jasmani, leading to section 3", () => {
    const html = shown(viewOf());

    expect(html).toContain('href="#kesehatan-jasmani"');
    expect(html).toContain("70% <small>prima dan baik</small>");
    expect(html).toContain(
      "30 dari 40 sudah dites. &lt;5 perlu tindak lanjut medis.",
    );
    expect(html).toContain("Perlu perhatian 6");
  });

  it("shows - and no bar on the card while nobody is tested", () => {
    const html = shown(
      viewOf({ physical: { kind: "untested", students: 40 } }),
    );

    expect(html).toContain("- <small>prima dan baik</small>");
    expect(html).toContain("Belum ada hasil tes kebugaran dari 40 mahasiswa.");
    expect(html).toContain("Belum ada hasil tes kebugaran.<");
    expect(sectionThree(html)).not.toContain("<meter");
    expect(html).not.toContain('aria-label="Prima ');
  });

  it("shows section 3 with the count and scores of each category, those not tested, and Lihat rincian to Penilaian jasmani", () => {
    const html = shown(viewOf(), LINKS);

    expect(html).toContain("Kategori tes kebugaran");
    expect(html).toContain("30 dari 40 sudah dites<");
    expect(html).toContain("Prima <span");
    expect(html).toContain("(85–100)");
    expect(html).toContain("(0–54)");
    expect(html).toMatch(
      /aria-label="Perlu tindak lanjut medis"><\/meter><span[^>]*>&lt;5</,
    );
    expect(html).toContain("10 mahasiswa belum mengikuti tes kebugaran.");
    expect(html).toContain('href="/penilaian/jasmani"');
    expect(html).not.toContain("Riwayat penyakit terbanyak");
  });

  it("shows Arti kategori with the range and meaning of each category, also while nobody is tested", () => {
    for (const physical of [
      viewOf().physical,
      { kind: "untested", students: 40 } as const,
    ]) {
      const html = shown(viewOf({ physical }));

      expect(html).toContain("Arti kategori");
      expect(html).toMatch(/>Prima<\/span> <span[^>]*>85–100<\/span>/);
      expect(html).toMatch(/>Baik<\/span> <span[^>]*>70–84<\/span>/);
      for (const meaning of [
        "Kebugaran sangat baik, tidak perlu catatan.",
        "Kebugaran baik, tidak perlu catatan.",
        "Perlu pemantauan; lengkapi catatan kesehatan.",
        "Perlu pemeriksaan atau penanganan medis; lengkapi catatan kesehatan.",
      ]) {
        expect(html).toContain(meaning);
      }
    }
  });

  it("names the most common illnesses only when the server sent them", () => {
    const view = viewOf();
    if (view.physical.kind !== "shown") throw new Error("No counts.");
    const html = shown({
      ...view,
      physical: {
        ...view.physical,
        illnesses: [{ illness: "asthma", students: 6 }],
      },
    });

    expect(html).toContain(
      "Riwayat penyakit terbanyak pada kategori perlu perhatian dan perlu tindak lanjut medis: Asma (6).",
    );
  });

  it("shows only why there are no counts in section 3 for a group with fewer than 5 tested", () => {
    const html = shown(viewOf({ physical: { kind: "too_few", students: 40 } }));

    expect(html.split(PHYSICAL_TOO_FEW)).toHaveLength(3);
    expect(html).not.toContain("sudah dites");
    expect(sectionThree(html)).not.toContain("<meter");
  });

  it("leaves out Program studi for Ketua Program Studi, Tahapan while no period runs, and Lihat rincian without the tab", () => {
    const html = shown(viewOf({ programs: null, stagesShown: false }));

    expect(html).not.toContain("Program studi<select");
    expect(html).not.toContain("Tahapan<select");
    expect(html).not.toContain("Lihat rincian");
  });

  it("shows only why there are no numbers for a group with too few assessed students", () => {
    const html = shown(viewOf({ achievement: { recap: null, cohorts: [] } }));

    expect(html.split(TOO_FEW)).toHaveLength(3);
    expect(html).not.toContain("Hasil asesmen");
    expect(html).not.toContain("Capaian MEDALI per angkatan");
  });

  it("shows no card and no section when no Aktif student matches", () => {
    const view = viewOf({
      filters: { ...NO_FILTERS, province: "Bali" },
    });
    const html = shown({
      ...view,
      counts: { ...view.counts, matching: 0 },
    });

    expect(html).toContain(
      "Tidak ada mahasiswa aktif dengan kombinasi filter ini.",
    );
    expect(html).toContain("mahasiswa sesuai 1 filter");
    expect(html).toContain("Atur ulang filter");
    expect(html).not.toContain("Capaian karakter");
  });
});
