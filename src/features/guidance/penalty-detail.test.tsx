// Sample NIMs of this file: 9944270000 to 9944270099. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PenaltyRow } from "./penalty-board";
import { PenaltyDetail } from "./penalty-detail";

const ROW: PenaltyRow = {
  id: "p1",
  studentId: "s1",
  name: "Mega Saragih",
  nim: "9944270013",
  program: "D3 Pajak",
  day: "2026-10-14",
  description: "Terlambat mengikuti apel pagi tiga kali dalam satu bulan.",
  category: "light",
  level: 1,
  status: "imposed",
  decisionNumber: "",
  socialWorkForms: ["grounds", "other"],
  socialWorkOther: "Menata arsip perpustakaan",
  socialWorkPlace: "campus",
  socialWorkStartsOn: "2026-10-15",
  socialWorkEndsOn: "2026-10-21",
  savedByName: "Agus Hermawan",
  semester: 3,
  conditionsMet: [],
  decision: "pending",
  version: 1,
};

function detail(row: PenaltyRow): string {
  return renderToStaticMarkup(<PenaltyDetail row={row} />);
}

describe("PenaltyDetail", () => {
  it("shows Uraian, the kerja sosial form, place and dates, who recorded it, Dasar and the cap on nilai karakter", () => {
    const shown = detail(ROW);
    expect(shown).toContain(ROW.description);
    expect(shown).toContain(
      "Merapikan dan membersihkan taman atau lingkungan PKN STAN; Lainnya: Menata arsip perpustakaan",
    );
    expect(shown).toContain("Unit kerja di lingkungan PKN STAN");
    expect(shown).toContain("15 Okt 2026 – 21 Okt 2026");
    expect(shown).toContain("Belum diisi");
    expect(shown).toContain("Agus Hermawan");
    expect(shown).toContain("ayat (2) huruf a");
    expect(shown).toContain("Nilai karakter paling tinggi 70");
  });

  it("shows the suspension of Berat jenjang pertama from the semester of the Tanggal, and its Nomor keputusan", () => {
    const shown = detail({
      ...ROW,
      category: "heavy",
      level: 1,
      decisionNumber: "KEP-009/PKN/2026",
    });
    expect(shown).toContain("KEP-009/PKN/2026");
    expect(shown).toContain(
      "Semester 3–4; mengulang seluruh mata kuliah semester 3",
    );
    expect(shown).not.toContain("paling tinggi 70");
  });

  it("shows no kerja sosial and no effect on nilai karakter for a penalty that ends the status", () => {
    const shown = detail({
      ...ROW,
      category: "heavy",
      level: 3,
      status: "set",
      socialWorkForms: [],
      socialWorkOther: "",
      socialWorkPlace: null,
      socialWorkStartsOn: null,
      socialWorkEndsOn: null,
    });
    expect(shown).not.toContain("Bentuk kerja sosial");
    expect(shown).not.toContain("Dampak nilai");
    expect(shown).toContain("ayat (4) huruf c");
  });
});
