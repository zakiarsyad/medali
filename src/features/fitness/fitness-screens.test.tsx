import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { START_PARAMS } from "./fitness-address";
import type { FitnessList } from "./fitness-board";
import type { FitnessNumbers } from "./fitness-counts";
import { STARTING_LIMITS, STARTING_VERSION } from "./fitness-ids";
import { FitnessListTable } from "./fitness-list-table";
import { FitnessScreen, ReadOnlyNote } from "./fitness-screen";
import { ReadOnlyLimits } from "./read-only-limits";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const TABS = { pagePath: "penilaian", tabs: [], open: "jasmani" };

const NUMBERS: FitnessNumbers = {
  students: 5,
  testedThisYear: 2,
  meanScore: 75,
  byCategory: { excellent: 1, good: 1, attention: 1, medical: 0 },
  untested: 2,
};

const LIST: FitnessList = {
  rows: [
    {
      id: "00000000-0000-4000-8000-000000000601",
      name: "Ani Contoh",
      nim: "9986200201",
      program: "D3 Pajak",
      latest: { score: 72, testedOn: "2026-10-01" },
    },
    {
      id: "00000000-0000-4000-8000-000000000602",
      name: "Budi Contoh",
      nim: "9986200202",
      program: "D3 Akuntansi",
      latest: null,
    },
  ],
  matching: 2,
  page: 1,
};

function screen(numbers: FitnessNumbers = NUMBERS) {
  return renderToStaticMarkup(
    <FitnessScreen
      tabs={TABS}
      year={2026}
      numbers={numbers}
      limits={STARTING_LIMITS}
      params={START_PARAMS}
      list={LIST}
      manage={<ReadOnlyNote />}
      limitsPart={null}
    />,
  );
}

describe("Penilaian jasmani", () => {
  it("shows the four numbers, with the hints of Sudah dites and Rerata skor only", () => {
    const html = screen();

    expect(html).toContain("Sudah dites 2026");
    expect(html).toContain("dari 5 mahasiswa aktif");
    expect(html).toContain("Rerata skor");
    expect(html).toContain("75,0");
    expect(html).toContain("2 prima dan baik");
    expect(html).toMatch(/Perlu perhatian<\/dt><dd[^>]*>1<\/dd><\/div>/);
    expect(html).toMatch(
      /Perlu tindak lanjut medis<\/dt><dd[^>]*>0<\/dd><\/div>/,
    );
  });

  it("shows - for Rerata skor while nobody is tested", () => {
    const html = screen({ ...NUMBERS, meanScore: null });

    expect(html).toMatch(/Rerata skor<\/dt><dd[^>]*>-<\/dd>/);
  });

  it("shows Kategori with a bar and the scores of each category, and how many are not tested", () => {
    const html = screen();

    expect(html).toContain("Kategori");
    for (const range of ["(85–100)", "(70–84)", "(55–69)", "(0–54)"]) {
      expect(html).toContain(range);
    }
    expect(html.match(/<meter /g)).toHaveLength(4);
    expect(html).toContain("2 mahasiswa belum mengikuti tes kebugaran.");
  });

  it("says when every student is tested", () => {
    const html = screen({ ...NUMBERS, untested: 0 });

    expect(html).toContain("Semua mahasiswa sudah mengikuti tes kebugaran.");
  });

  it("tells a role that only reads who enters the scores", () => {
    expect(screen()).toContain(
      "Hasil tes kebugaran diinput oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa.",
    );
  });

  it("shows Hasil tes kebugaran with the search and the filter by category and Belum dites", () => {
    const html = screen();

    expect(html).toContain("Hasil tes kebugaran");
    expect(html).toContain('placeholder="Cari nama atau NIM"');
    for (const choice of [
      "Semua kategori",
      "Prima",
      "Baik",
      "Perlu perhatian",
      "Perlu tindak lanjut medis",
      "Belum dites",
    ]) {
      expect(html).toContain(`>${choice}</option>`);
    }
  });
});

describe("Hasil tes kebugaran", () => {
  it("shows the name, NIM and program, the day of the test, Skor and Kategori, or Belum dites", () => {
    const html = renderToStaticMarkup(
      <FitnessListTable rows={LIST.rows} limits={STARTING_LIMITS} />,
    );

    expect(html).toContain("Ani Contoh");
    expect(html).toContain("9986200201 · D3 Pajak");
    expect(html).toContain('<td data-title="Tes">1 Okt 2026</td>');
    expect(html).toMatch(/data-title="Skor">72<\/td>/);
    expect(html).toMatch(/data-title="Kategori"><span[^>]*>Baik<\/span>/);
    expect(html).toMatch(/data-title="Tes">-<\/td>/);
    expect(html).toMatch(
      /data-title="Kategori"><span[^>]*>Belum dites<\/span>/,
    );
  });

  it("works the category out again with the limits in force: with Baik from 75, 72 is Perlu perhatian", () => {
    const html = renderToStaticMarkup(
      <FitnessListTable
        rows={LIST.rows}
        limits={{ ...STARTING_LIMITS, goodFrom: 75 }}
      />,
    );

    expect(html).toMatch(
      /data-title="Kategori"><span[^>]*>Perlu perhatian<\/span>/,
    );
  });

  it("says when no student matches", () => {
    const html = renderToStaticMarkup(
      <FitnessListTable rows={[]} limits={STARTING_LIMITS} />,
    );

    expect(html).toContain("Tidak ada data pada filter ini.");
  });
});

describe("Ambang skor for a role that only reads it", () => {
  const STARTING = {
    limits: STARTING_LIMITS,
    version: STARTING_VERSION,
    set: null,
  };

  it("shows the three limits with every field switched off, and who sets them", () => {
    const html = renderToStaticMarkup(<ReadOnlyLimits inForce={STARTING} />);

    const fields = html.match(/<input[^>]*>/g) ?? [];
    expect(fields).toHaveLength(3);
    for (const field of fields) expect(field).toContain("disabled");
    for (const label of [
      "Prima mulai",
      "Baik mulai",
      "Perlu perhatian mulai",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain('value="85"');
    expect(html).toContain(
      "Di bawah ambang perlu perhatian: perlu tindak lanjut medis. Ambang awal, sesuaikan dengan pedoman tes kebugaran.",
    );
    expect(html).toContain(
      "Ambang ditetapkan oleh Kepala Unit Pembangunan Karakter.",
    );
    expect(html).not.toContain("Simpan ambang");
  });

  it("says when and by whom set limits were set", () => {
    const html = renderToStaticMarkup(
      <ReadOnlyLimits
        inForce={{
          limits: STARTING_LIMITS,
          version: "a",
          set: { at: new Date("2026-10-16T03:00:00Z"), by: "Kepala Uji" },
        }}
      />,
    );

    expect(html).toContain("Ditetapkan 16 Okt 2026 oleh Kepala Uji.");
  });
});
