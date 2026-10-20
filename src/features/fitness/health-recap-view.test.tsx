import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RecapRow, SickList } from "@/health-notes/sick-list";
import { START_PARAMS } from "./fitness-address";
import { RecapNumberCards, RecapPanel } from "./health-recap-view";
import { RECAP_START } from "./recap-address";

const ANI: RecapRow = {
  id: "00000000-0000-4000-8000-000000000951",
  name: "Ani Contoh",
  nim: "9986300951",
  program: "D3 Pajak",
  dorm: null,
  room: null,
  mentorName: "Pengasuh Contoh",
  final: { category: "attention", fromNote: true },
  note: {
    id: "00000000-0000-4000-8000-000000000952",
    examinedOn: "2026-10-12",
    examiner: null,
    illnesses: [{ illness: "asthma", note: "sejak SMP" }],
    otherHistory: "",
    medicine: "",
    advice: "Bawa inhaler.",
    category: "attention",
    savedBy: "Penilai Contoh",
  },
};

const EKA: RecapRow = {
  id: "00000000-0000-4000-8000-000000000953",
  name: "Eka Contoh",
  nim: "9986300953",
  program: "D3 Pajak",
  dorm: "dana_rakca",
  room: { dorm: "dana_rakca", floor: 2, number: "12" },
  mentorName: null,
  final: { category: "medical", fromNote: false },
  note: null,
};

const RECAP: SickList = {
  numbers: {
    students: 6,
    dorm: 1,
    listed: 5,
    attention: 1,
    medical: 2,
    medicalWithoutNote: 2,
  },
  rows: [EKA, ANI],
  matching: 2,
  page: 1,
};

describe("the numbers of the recap", () => {
  it("shows the four numbers with their hints", () => {
    const html = renderToStaticMarkup(
      <RecapNumberCards numbers={RECAP.numbers} />,
    );

    for (const words of [
      "Mahasiswa aktif",
      "1 asrama · 5 non asrama",
      "Sakit atau punya riwayat penyakit",
      "83% mahasiswa",
      "Perlu perhatian",
      "pemantauan",
      "Perlu tindak lanjut medis",
      "2 belum punya catatan",
    ]) {
      expect(html).toContain(words);
    }
  });
});

describe("Rekap data kesehatan seluruh mahasiswa", () => {
  function shown(recap = RECAP, params = RECAP_START) {
    return renderToStaticMarkup(
      <RecapPanel recap={recap} list={START_PARAMS} params={params} />,
    );
  }

  it("offers the search and the filters by tempat tinggal, kategori and the nine illnesses", () => {
    const html = shown();

    expect(html).toContain("Rekap data kesehatan seluruh mahasiswa");
    expect(html).toContain('name="rcari"');
    for (const choice of [
      "Asrama dan non asrama",
      "Non asrama",
      "Semua kategori",
      "Perlu tindak lanjut medis",
      "Semua riwayat penyakit",
      "Penyakit menular",
    ]) {
      expect(html).toContain(`>${choice}</option>`);
    }
    expect(html).not.toContain(">Lainnya</option>");
    expect(html).not.toContain(">Belum dites</option>");
  });

  it("shows each student as a block on a phone, with room, Pengasuh, category, illnesses, note and who and when", () => {
    const html = shown();

    expect(html).toContain("stacked");
    expect(html).toContain('<td data-title="Kamar">Non asrama</td>');
    expect(html).toContain(
      '<td data-title="Kamar">Dana Rakca, lantai 2, kamar 12</td>',
    );
    expect(html).toContain('<td data-title="Pengasuh">Pengasuh Contoh</td>');
    expect(html).toContain('<td data-title="Pengasuh">-</td>');
    expect(html).toContain("berdasarkan catatan kesehatan");
    expect(html).toContain(">Asma</span>");
    expect(html).toContain("Riwayat: Asma (sejak SMP). Bawa inhaler.");
    expect(html).toContain(">Belum ada catatan</span>");
    expect(html).toContain("12 Okt 2026");
    expect(html).toContain("Penilai Contoh");
    expect(html).toContain("1–2 dari 2 mahasiswa");
  });

  it("says how many have the illness filtered by", () => {
    const html = shown(RECAP, { ...RECAP_START, illness: "asthma" });

    expect(html).toContain("2 mahasiswa dengan riwayat asma.");
  });

  it("says when nobody matches", () => {
    const html = shown({ ...RECAP, rows: [], matching: 0 });

    expect(html).toContain("Tidak ada mahasiswa yang sakit pada filter ini.");
  });
});
