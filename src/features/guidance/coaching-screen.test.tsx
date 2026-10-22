// Sample NIMs of this file: 9987707000 to 9987707099. None is added to
// the database.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { COACHING_START, type CoachingParams } from "./coaching-address";
import type { CoachingBoard, CoachingRow } from "./coaching-board";
import { CoachingScreen } from "./coaching-screen";

vi.mock("next/form", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

const ROW: CoachingRow = {
  studentId: "s1",
  name: "Gita Purba",
  nim: "9987707001",
  program: "D3 Kepabeanan dan Cukai",
  semester: 3,
  mentorName: "Hendra Wijaya",
  level: "intensive",
  weakest: "M",
  weakestScore: 55,
  rerata: 58.3,
  status: "counselling",
  note: "Diajak bicara tentang kehadiran apel.",
  version: 1,
  mayChange: false,
};

function board(rows: CoachingRow[], menteesOnly = false): CoachingBoard {
  return {
    numbers: { open: 4, identified: 6, intensive: 2, moderate: 1, light: 1 },
    list: { rows, matching: rows.length, page: 1 },
    menteesOnly,
  };
}

function screen(
  rows: CoachingRow[],
  menteesOnly = false,
  params: CoachingParams = COACHING_START,
): string {
  return renderToStaticMarkup(
    <CoachingScreen
      tabs={{ pagePath: "pembinaan", tabs: [], open: "karakter" }}
      board={board(rows, menteesOnly)}
      params={params}
    />,
  );
}

describe("CoachingScreen", () => {
  it("shows Belum selesai out of all identified, and the three levels with their limits", () => {
    const shown = screen([ROW]);
    expect(shown).toContain("Belum selesai");
    expect(shown).toContain("dari 6 teridentifikasi");
    expect(shown).toContain("Intensif");
    expect(shown).toContain("rerata di bawah 60");
    expect(shown).toContain("Sedang");
    expect(shown).toContain("rerata 60–64");
    expect(shown).toContain("Ringan");
    expect(shown).toContain("satu nilai di bawah 58");
  });

  it("shows a row with the student, Pengasuh, level, Aspek terlemah with its score, Rerata, status and note", () => {
    const shown = screen([ROW]);
    expect(shown).toContain(">Gita Purba</b>");
    expect(shown).toContain("9987707001 · D3 Kepabeanan dan Cukai · Smt 3");
    expect(shown).toContain("Hendra Wijaya");
    expect(shown).toContain(">Intensif</span>");
    expect(shown).toContain("Mandiri");
    expect(shown).toContain(">55<");
    expect(shown).toContain("58,3");
    expect(shown).toContain(">Konseling</span>");
    expect(shown).toContain("Diajak bicara tentang kehadiran apel.");
  });

  it("shows a dash for a student with no Pengasuh, and no semester while no period runs", () => {
    const shown = screen([{ ...ROW, mentorName: null, semester: null }]);
    expect(shown).toContain('data-title="Pengasuh">-</td>');
    expect(shown).toContain("9987707001 · D3 Kepabeanan dan Cukai<");
  });

  it("offers the search, the levels and the status choices, Belum selesai first", () => {
    const shown = screen([ROW]);
    expect(shown).toContain('placeholder="Cari nama atau NIM"');
    expect(shown).toContain(">Semua tingkat</option>");
    const status = shown.match(
      /<select[^>]*aria-label="Status"[^>]*>(.*?)<\/select>/,
    )?.[1];
    expect(status).toMatch(
      /^<option value=""[^>]*>Belum selesai<\/option><option value="semua">Semua status<\/option>/,
    );
    for (const word of [
      "Teridentifikasi",
      "Konseling",
      "Pemantauan",
      "Selesai",
    ]) {
      expect(status).toContain(`>${word}</option>`);
    }
  });

  it("says Konseling is only a mark, under the list and with no row as well", () => {
    const line =
      "Status Konseling di sini hanya penanda; mahasiswa tidak otomatis didaftarkan konseling.";
    expect(screen([ROW])).toContain(line);
    expect(screen([])).toContain(line);
  });

  it("says so when no student matches", () => {
    expect(screen([])).toContain("Tidak ada mahasiswa pada filter ini.");
  });

  it("tells Pengasuh the list holds their own mentees, and nobody else", () => {
    expect(screen([ROW], true)).toContain("Menampilkan mahasiswa binaan Anda.");
    expect(screen([ROW])).not.toContain("Menampilkan mahasiswa binaan Anda.");
  });

  it("makes each name open the student's profile over the tab, keeping the search and the page", () => {
    const shown = screen([ROW], false, {
      ...COACHING_START,
      query: "Gita",
      page: 2,
    });
    expect(shown).toMatch(
      /<a [^>]*href="\/pembinaan\/karakter\?cari=Gita&amp;hal=2&amp;profil=s1"[^>]*><b[^>]*>Gita Purba<\/b><\/a>/,
    );
  });

  it("shows a reader the status as a label, with nothing to choose", () => {
    const shown = screen([ROW]);
    expect(shown).not.toContain('<select aria-label="Status pembinaan');
    expect(shown).not.toContain("Simpan status");
  });
});
