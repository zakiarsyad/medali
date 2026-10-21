import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Recap } from "./achievement-recap";
import { TOO_FEW } from "./achievement-words";
import { NO_FILTERS } from "./dashboard-address";
import { DashboardScreen } from "./dashboard-screen";
import type { DashboardView } from "./dashboard-view";

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
    physical: {
      kind: "shown",
      students: 40,
      tested: 30,
      untested: 10,
      byCategory: { excellent: 12, good: 9, attention: 6, medical: "<5" },
      fitShare: 70,
    },
    ...more,
  };
}

function shown(view: DashboardView, detailAddress: string | null = null) {
  return renderToStaticMarkup(
    <DashboardScreen view={view} detailAddress={detailAddress} />,
  );
}

describe("DashboardScreen", () => {
  it("shows the filter, the card, section 1 and the cohorts", () => {
    const html = shown(viewOf(), "/penilaian/asesmen");

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
    expect(html).not.toContain("Perlu perhatian");
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
