import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PenaltiesScreen } from "./penalties-screen";
import { PENALTIES_START } from "./penalty-address";
import type { PenaltyBoard, PenaltyRow } from "./penalty-board";

vi.mock("next/form", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

const ROW: PenaltyRow = {
  id: "p1",
  studentId: "s1",
  name: "Mega Saragih",
  nim: "9900250013",
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
};

const DISMISSED: PenaltyRow = {
  ...ROW,
  id: "p2",
  category: "heavy",
  level: 2,
  status: "set",
  decisionNumber: "KEP-021/PKN/2026",
  socialWorkForms: [],
  socialWorkOther: "",
  socialWorkPlace: null,
  socialWorkStartsOn: null,
  socialWorkEndsOn: null,
};

function board(rows: PenaltyRow[], menteesOnly = false): PenaltyBoard {
  return {
    numbers: { light: 4, medium: 2, heavy: 1, unfinishedWork: 3 },
    list: { rows, matching: rows.length, page: 1 },
    menteesOnly,
  };
}

function screen(
  rows: PenaltyRow[],
  form: string | null,
  menteesOnly = false,
): string {
  return renderToStaticMarkup(
    <PenaltiesScreen
      tabs={{ pagePath: "pembinaan", tabs: [], open: "disiplin" }}
      board={board(rows, menteesOnly)}
      params={PENALTIES_START}
      form={form}
    />,
  );
}

describe("PenaltiesScreen", () => {
  it("shows the four numbers", () => {
    const shown = screen([ROW], null);
    for (const label of [
      "Pelanggaran ringan",
      "Pelanggaran sedang",
      "Pelanggaran berat",
      "Kerja sosial belum selesai",
    ]) {
      expect(shown).toContain(label);
    }
  });

  it("gives a reader the line on who records, and no form", () => {
    const shown = screen([ROW], null);
    expect(shown).toContain(
      "Pencatatan pelanggaran dilakukan oleh Kepala Unit Pembangunan Karakter dan Pembina Disiplin Mahasiswa.",
    );
    expect(shown).not.toContain("Menampilkan mahasiswa binaan Anda.");
  });

  it("gives an account that records the form in place of that line", () => {
    const shown = screen([ROW], "FORMULIR");
    expect(shown).toContain("FORMULIR");
    expect(shown).not.toContain("Pencatatan pelanggaran dilakukan");
  });

  it("tells Pengasuh the list holds their own mentees", () => {
    expect(screen([ROW], null, true)).toContain(
      "Menampilkan mahasiswa binaan Anda.",
    );
  });

  it("shows a penalty with its student, Jenjang, penalty, kerja sosial and status", () => {
    const shown = screen([ROW, DISMISSED], null);
    expect(shown).toContain("Daftar pelanggaran");
    expect(shown).toContain("9900250013 · D3 Pajak");
    expect(shown).toContain("Ringan · jenjang pertama");
    expect(shown).toContain("Teguran lisan tertulis");
    expect(shown).toContain("7 hari");
    expect(shown).toContain("s.d. 21 Okt 2026");
    expect(shown).toContain("Dijatuhkan");
    expect(shown).toContain("Berat · jenjang kedua");
    expect(shown).toContain("Ditetapkan");
    expect(shown).toContain("Rincian");
  });

  it("says so when no penalty matches", () => {
    expect(screen([], null)).toContain(
      "Belum ada pelanggaran pada filter ini.",
    );
  });

  it("shows the rules of all nine Jenjang with their legal basis", () => {
    const shown = screen([], null);
    expect(shown).toContain("Ketentuan hukuman disiplin");
    for (const basis of [
      "ayat (2) huruf a",
      "ayat (3) huruf c",
      "ayat (4) huruf c",
    ]) {
      expect(shown).toContain(basis);
    }
    expect(shown).toContain("Paling tinggi 70");
    expect(shown).toContain("Mengulang semester berkenaan");
    expect(shown).toContain("8 bulan");
  });
});
