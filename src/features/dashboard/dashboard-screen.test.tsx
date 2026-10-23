import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { STARTING_SCHEME } from "@/character-grades/scheme-ids";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import type { PublishedRow } from "@/mental-health/mental-recap";
import type { Recap } from "./achievement-recap";
import { TOO_FEW } from "./achievement-words";
import { NO_FILTERS } from "./dashboard-address";
import { DashboardScreen, type DetailLinks } from "./dashboard-screen";
import type { DashboardView } from "./dashboard-view";
import type { ShownGrades } from "./grade-recap";
import { NO_GRADES } from "./grade-words";
import {
  MENTAL_TOO_FEW,
  NOBODY_ASSESSED,
  NOTHING_PUBLISHED,
} from "./mental-words";
import type { LatestNote } from "./mentoring-recap";
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

const PUBLISHED_ROW: PublishedRow = {
  studentId: "00000000-0000-4000-8000-000000000001",
  publishedAt: new Date("2026-10-21T03:00:00Z"),
  name: "Mahasiswa Contoh",
  mentorName: "Pengasuh Contoh",
  data: ["level", "counselling"],
  level: "moderate",
  sessions: null,
  summary: null,
};

const OTHER_NOTE_ID = "00000000-0000-4000-8000-000000000003";

const LATEST_NOTE: LatestNote = {
  id: "00000000-0000-4000-8000-000000000002",
  happenedOn: "2026-10-20",
  kind: "appreciation",
  valueKeys: ["E", "I"],
  note: "Memimpin kerja bakti asrama.",
  followUp: "watch_two_weeks",
  studentId: "00000000-0000-4000-8000-000000000001",
  studentName: "Mahasiswa Catatan",
  writer: { name: "Pengasuh Contoh", title: null },
  opensDetail: true,
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
      dorms: new Map([
        ["semua", 30],
        ["wismantara", 0],
        ["dana_rakca", 18],
        ["cipta_bakti", 12],
        ["non", 10],
      ]),
    },
    achievement: {
      recap: RECAP,
      cohorts: [{ cohortYear: 2025, entryPath: "regular", recap: RECAP }],
    },
    grades: {
      scheme: STARTING_SCHEME,
      recap: GRADES,
      cohorts: [{ cohortYear: 2025, entryPath: "regular", recap: GRADES }],
    },
    physical: {
      kind: "shown",
      students: 40,
      tested: 30,
      untested: 10,
      byCategory: { excellent: 12, good: 9, attention: 6, medical: "<5" },
      fitShare: 70,
      illnesses: null,
    },
    mental: {
      recap: {
        kind: "shown",
        assessed: 30,
        byLevel: {
          normal: 14,
          mild: 7,
          moderate: 5,
          severe: "<5",
          extremely_severe: 0,
        },
      },
      published: { rows: [PUBLISHED_ROW], matching: 3, needCounselling: 1 },
    },
    mentoring: {
      numbers: {
        everyone: null,
        mentors: 6,
        groups: 8,
        recentNotes: 12,
        openCoaching: 5,
        intensiveCoaching: 2,
      },
      programs: [
        { programId: 1, name: "D3 Pajak", students: 40, average: 80.5 },
        { programId: 2, name: "D4 Akuntansi", students: 12, average: 74.3 },
        { programId: 3, name: "D3 Kepabeanan", students: 3, average: null },
      ],
      notes: [
        LATEST_NOTE,
        {
          ...LATEST_NOTE,
          id: OTHER_NOTE_ID,
          opensDetail: false,
          studentName: "Mahasiswa Tanpa Profil",
          followUp: "none",
        },
      ],
    },
    fitnessLimits: STARTING_LIMITS,
    ...more,
  };
}

const NO_LINKS = {
  assessment: null,
  grade: null,
  fitness: null,
  mental: null,
  students: null,
  mentors: null,
  notes: null,
  coaching: null,
};
const LINKS = {
  assessment: "/penilaian/asesmen",
  grade: "/penilaian/karakter",
  fitness: "/penilaian/jasmani",
  mental: "/penilaian/mental",
  students: "/mahasiswa",
  mentors: "/pengasuh/daftar",
  notes: "/pengasuhan/catatan",
  coaching: "/pembinaan/karakter",
};

function shown(view: DashboardView, links: DetailLinks = NO_LINKS) {
  return renderToStaticMarkup(<DashboardScreen view={view} links={links} />);
}

/** What the page shows of section 4. */
function sectionFour(html: string): string {
  return html.slice(
    html.indexOf('id="kesehatan-mental"'),
    html.indexOf('id="pendampingan"'),
  );
}

/** What the page shows from Pendampingan on. */
function mentoringPart(html: string): string {
  return html.slice(html.indexOf('id="pendampingan"'));
}

/** What the page shows of section 3, where the bars of 2 and 4 are not. */
function sectionThree(html: string): string {
  return html.slice(
    html.indexOf('id="kesehatan-jasmani"'),
    html.indexOf('id="kesehatan-mental"'),
  );
}

describe("DashboardScreen", () => {
  it("shows the filter, the card, section 1 and the cohorts", () => {
    const html = shown(viewOf(), LINKS);

    expect(html).toContain("Dashboard pembangunan karakter");
    for (const label of [
      "Tahapan",
      "Asrama",
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

  it("offers Asrama second, after Tahapan, with the count beside each choice, Asrama dan non asrama chosen and a choice with none hidden", () => {
    const html = shown(viewOf());
    const asrama = html.slice(
      html.indexOf("Asrama<select"),
      html.indexOf("</select>", html.indexOf("Asrama<select")),
    );

    expect(html.indexOf("Asrama<select")).toBeGreaterThan(
      html.indexOf("Tahapan<select"),
    );
    expect(html.indexOf("Asrama<select")).toBeLessThan(
      html.indexOf("Program studi<select"),
    );
    expect(asrama).toContain('name="asrama"');
    expect(asrama).toContain(
      '<option value="" selected="">Asrama dan non asrama</option>',
    );
    expect(asrama).toContain(
      '<option value="semua">Semua asrama (30)</option>',
    );
    expect(asrama).toContain(
      '<option value="dana_rakca">Asrama Dana Rakca (18)</option>',
    );
    expect(asrama).toContain(
      '<option value="cipta_bakti">Asrama Cipta Bakti (12)</option>',
    );
    expect(asrama).toContain('<option value="non">Non asrama (10)</option>');
    expect(asrama).not.toContain("Wismantara");
  });

  it("puts Asrama inside the folded Filter button with the other choices, for a phone", () => {
    const html = shown(viewOf());
    const button = html.indexOf('aria-expanded="false"');
    // The choices sit in a form part inside the part that folds; both end here.
    const folded = html.slice(button, html.indexOf("</div></div>", button));

    expect(folded).toContain(">Filter</button>");
    for (const label of ["Tahapan", "Asrama", "Program studi", "Instansi"]) {
      expect(folded).toContain(`${label}<select`);
    }
  });

  it("names Asrama Wismantara when it holds students", () => {
    const view = viewOf();
    const html = shown({
      ...view,
      counts: {
        ...view.counts,
        dorms: new Map([...view.counts.dorms, ["wismantara", 4]]),
      },
    });

    expect(html).toContain(
      '<option value="wismantara">Asrama Wismantara (4)</option>',
    );
  });

  it("counts Asrama as one filter in the line, keeps it chosen, and clears it with Atur ulang filter", () => {
    const html = shown(
      viewOf({
        filters: { ...NO_FILTERS, dorm: "dana_rakca", province: "Bali" },
      }),
    );

    expect(html).toContain("mahasiswa sesuai 2 filter");
    expect(html).toContain(
      '<option value="dana_rakca" selected="">Asrama Dana Rakca (18)</option>',
    );
    expect(html).toMatch(/href="\/dashboard"[^>]*>Atur ulang filter</);
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
        grades: {
          scheme: STARTING_SCHEME,
          recap: { kind: "too_few" },
          cohorts: [],
        },
      }),
    );
    const none = shown(
      viewOf({
        grades: {
          scheme: STARTING_SCHEME,
          recap: { kind: "none" },
          cohorts: [],
        },
      }),
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
        grades: {
          scheme: STARTING_SCHEME,
          recap: { kind: "too_few" },
          cohorts: [],
        },
        achievement: { recap: RECAP, cohorts: [] },
      }),
    );
    const none = shown(
      viewOf({
        grades: {
          scheme: STARTING_SCHEME,
          recap: { kind: "none" },
          cohorts: [],
        },
      }),
    );

    expect(tooFew.split(TOO_FEW)).toHaveLength(3);
    expect(none.split(NO_GRADES)).toHaveLength(3);
    for (const html of [tooFew, none]) {
      expect(html).toContain('id="nilai-karakter"');
      expect(html).not.toContain("Komponen nilai karakter");
      expect(html).not.toContain("Sebaran huruf");
    }
  });

  it("shows Nilai karakter per angkatan with the count, the four parts, Nilai akhir and the percent that meets the pass letter", () => {
    const html = shown(viewOf());
    const table = html.slice(html.indexOf("Nilai karakter per angkatan"));

    expect(table).toContain(
      "<th>Kehadiran</th><th>Pengasuhan</th><th>SIKU</th><th>SKPM</th><th>Nilai akhir</th><th>Memenuhi B</th>",
    );
    expect(table).toContain("Angkatan 2025");
    expect(table).toContain("Reguler · Smt 3");
    expect(table).toContain('data-title="Jumlah">36<');
    expect(table).toContain('data-title="Kehadiran">88,2<');
    expect(table).toContain('data-title="Nilai akhir"><b>78,4</b>');
    expect(table).toContain('data-title="Memenuhi B">81%<');
  });

  it("says why no cohort is shown, and shows no table for a group without grade numbers", () => {
    const view = viewOf();
    const empty = shown({ ...view, grades: { ...view.grades, cohorts: [] } });
    const tooFew = shown(
      viewOf({
        grades: {
          scheme: STARTING_SCHEME,
          recap: { kind: "too_few" },
          cohorts: [],
        },
      }),
    );

    expect(empty).toContain(
      "Angkatan tampil bila minimal 20 mahasiswa sudah memiliki nilai akhir",
    );
    expect(tooFew).not.toContain("Nilai karakter per angkatan");
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

  it("shows the card Kesehatan mental after Kesehatan jasmani, leading to section 4", () => {
    const html = shown(viewOf());

    expect(html.indexOf('href="#kesehatan-mental"')).toBeGreaterThan(
      html.indexOf('href="#kesehatan-jasmani"'),
    );
    expect(html).toContain("30 <small>diasesmen</small>");
    expect(html).toContain(
      "3 data dipublikasikan konselor untuk Anda, 1 perlu konseling.",
    );
  });

  it("shows <5 or 0 on the card Kesehatan mental for a small group", () => {
    const few = shown(
      viewOf({ mental: { recap: { kind: "too_few" }, published: null } }),
    );
    const none = shown(
      viewOf({ mental: { recap: { kind: "none" }, published: null } }),
    );

    expect(few).toContain("&lt;5 <small>diasesmen</small>");
    expect(none).toContain("0 <small>diasesmen</small>");
    expect(none).toContain("0 data dipublikasikan konselor untuk Anda.");
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

  it("shows section 4 with the count of each level, <5 for 1 to 4, and Lihat rincian to Penilaian > Kesehatan mental", () => {
    const html = shown(viewOf(), LINKS);
    const four = sectionFour(html);

    expect(four).toContain("Rekap anonim asesmen dan data perorangan");
    expect(four).toContain("Kesehatan mental mahasiswa");
    expect(four).toContain("rekap anonim");
    expect(four).toMatch(/>Normal<\/span><meter[^>]*><\/meter><span[^>]*>14</);
    expect(four).toMatch(/aria-label="Berat"><\/meter><span[^>]*>&lt;5</);
    expect(four).toMatch(/aria-label="Sangat berat"><\/meter><span[^>]*>0</);
    expect(four).toContain(
      "30 mahasiswa sudah diasesmen. Identitas tidak ditampilkan kecuali dipublikasikan konselor.",
    );
    expect(four).toContain('href="/penilaian/mental"');
  });

  it("shows only why there are no counts in section 4 for a group with 1 to 4 assessed, or none", () => {
    const few = sectionFour(
      shown(
        viewOf({ mental: { recap: { kind: "too_few" }, published: null } }),
      ),
    );
    const none = sectionFour(
      shown(viewOf({ mental: { recap: { kind: "none" }, published: null } })),
    );

    expect(few).toContain(MENTAL_TOO_FEW);
    expect(few).not.toContain("<meter");
    expect(few).not.toContain("sudah diasesmen");
    expect(none).toContain(NOBODY_ASSESSED);
    expect(none).not.toContain("<meter");
  });

  it("lists each published student with the date, the name and level, the Pengasuh and the parts shared, the name not a link", () => {
    const four = sectionFour(shown(viewOf(), LINKS));

    expect(four).toContain("Data kesehatan mental yang dipublikasikan");
    expect(four).toContain("21 Okt 2026");
    expect(four).toMatch(/<b>Mahasiswa Contoh<\/b> <span[^>]*>Sedang<\/span>/);
    expect(four).toContain(
      "Pengasuh: Pengasuh Contoh. Belum ada sesi konseling.",
    );
    expect(four.split('href="/penilaian/mental"')).toHaveLength(3);
    expect(four).not.toContain("Risiko");
  });

  it("says so when nothing is published to the account", () => {
    const view = viewOf();
    const html = shown({
      ...view,
      mental: {
        ...view.mental,
        published: { rows: [], matching: 0, needCounselling: 0 },
      },
    });

    expect(sectionFour(html)).toContain(NOTHING_PUBLISHED);
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

describe("Pendampingan on the Dashboard", () => {
  it("comes below section 4, with its line", () => {
    const html = shown(viewOf(), LINKS);
    const part = mentoringPart(html);

    expect(html.indexOf('id="pendampingan"')).toBeGreaterThan(
      html.indexOf('id="kesehatan-mental"'),
    );
    expect(part).toContain(">Pendampingan</h2>");
    expect(part).toContain("Pengasuhan dan pembinaan mahasiswa sesuai filter.");
  });

  it("shows the four numbers, each leading to its menu", () => {
    const part = mentoringPart(shown(viewOf(), LINKS));

    expect(part).toMatch(/href="\/mahasiswa".*Mahasiswa aktif.*>40</);
    expect(part).toMatch(/href="\/pengasuh\/daftar".*Pengasuh.*>6</);
    expect(part).toContain("8 kelompok pengasuhan");
    expect(part).toMatch(
      /href="\/pengasuhan\/catatan".*Catatan 30 hari terakhir.*>12</,
    );
    expect(part).toContain("konseling, mentoring, apresiasi");
    expect(part).toMatch(/href="\/pembinaan\/karakter".*Perlu pembinaan.*>5</);
    expect(part).toContain("2 di antaranya intensif");
    expect(part).not.toMatch(/dari [\d.]+ mahasiswa aktif/);
  });

  it("says how many Aktif students there are without the filter while one is in use", () => {
    const view = viewOf({ filters: { ...NO_FILTERS, province: "Bali" } });
    const part = mentoringPart(
      shown({
        ...view,
        mentoring: {
          ...view.mentoring,
          numbers: { ...view.mentoring.numbers, everyone: 1250 },
        },
      }),
    );

    expect(part).toContain("dari 1.250 mahasiswa aktif");
  });

  it("shows the numbers without a link, and no Lihat semua, for an account that may not open the menu", () => {
    const part = mentoringPart(shown(viewOf()));

    expect(part).toContain("Mahasiswa aktif");
    for (const address of [
      "/mahasiswa",
      "/pengasuh/daftar",
      "/pengasuhan/catatan",
      "/pembinaan/karakter",
    ]) {
      expect(part).not.toContain(`href="${address}"`);
    }
    expect(part).not.toContain("Lihat semua");
  });

  it("shows Capaian MEDALI per program studi as the server sent it, a bar from 50 and the average", () => {
    const part = mentoringPart(shown(viewOf()));

    expect(part).toContain("Capaian MEDALI per program studi");
    expect(part).toContain("skala 0–100");
    expect(part).toContain(
      "Batang dimulai dari nilai 50 agar selisih antarprodi terlihat.",
    );
    expect(part).toMatch(
      /D3 Pajak.*\(40\).*min="50" max="100" value="80.5".*80,5/,
    );
    expect(part.indexOf("D3 Pajak")).toBeLessThan(part.indexOf("D4 Akuntansi"));
    expect(part).toContain("74,3");
  });

  it("shows - and no bar for a program without an average", () => {
    const part = mentoringPart(shown(viewOf()));
    const small = part.slice(part.indexOf("D3 Kepabeanan"));

    expect(part.split("<meter")).toHaveLength(3);
    expect(small).toMatch(/\(3\).*>-</);
  });

  it("shows one line in place of the programs and the note when no program has an average", () => {
    const view = viewOf();
    const part = mentoringPart(
      shown({
        ...view,
        mentoring: {
          ...view.mentoring,
          programs: [
            { programId: 1, name: "D3 Pajak", students: 4, average: null },
            { programId: 3, name: "D3 Kepabeanan", students: 3, average: null },
          ],
        },
      }),
    );

    expect(part).toContain("Capaian MEDALI per program studi");
    expect(part).toContain(
      "Belum ada program studi yang dapat ditampilkan. Rerata program studi tampil bila minimal 5 mahasiswa sudah diasesmen, agar nilai perorangan tidak dapat ditebak.",
    );
    expect(part).not.toContain("D3 Pajak");
    expect(part).not.toContain("D3 Kepabeanan");
    expect(part).not.toContain("Batang dimulai dari nilai 50");
  });

  it("leaves out the panel for Ketua Program Studi", () => {
    const view = viewOf({ programs: null });
    const part = mentoringPart(
      shown({ ...view, mentoring: { ...view.mentoring, programs: null } }),
    );

    expect(part).not.toContain("Capaian MEDALI per program studi");
    expect(part).toContain("Perlu pembinaan");
  });

  it("lists the latest notes with the date, the student, the kind, the values, the note and the follow-up, and Lihat semua", () => {
    const view = viewOf({ filters: { ...NO_FILTERS, province: "Bali" } });
    const part = mentoringPart(shown(view, LINKS));

    expect(part).toContain("Catatan pengasuhan terbaru");
    expect(part).toMatch(/href="\/pengasuhan\/catatan"[^>]*>Lihat semua</);
    expect(part).toContain("20 Okt 2026");
    expect(part).toContain(
      'href="/dashboard?provinsi=Bali&amp;profil=00000000-0000-4000-8000-000000000001"',
    );
    expect(part).toContain(">Mahasiswa Catatan</a>");
    expect(part).toContain("Apresiasi");
    expect(part).toContain("Integritas");
    expect(part).toContain("Memimpin kerja bakti asrama.");
    expect(part).toContain("Tindak lanjut: Pantau dua pekan.");
  });

  it("names a student whose detail the account may not open without a link", () => {
    const part = mentoringPart(shown(viewOf(), LINKS));

    expect(part).toContain("<b>Mahasiswa Tanpa Profil</b>");
  });

  it("says so when there is no note", () => {
    const view = viewOf();
    const part = mentoringPart(
      shown({ ...view, mentoring: { ...view.mentoring, notes: [] } }),
    );

    expect(part).toContain("Belum ada catatan.");
  });
});
