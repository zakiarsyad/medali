import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EMERGENCY_TEXT } from "./counselling-screen";
import { ScreeningHistory } from "./screening-history";
import { NOBODY_MATCHING, NOBODY_SCREENED } from "./screening-list";
import { ScreeningScreen } from "./screening-screen";
import type { ScreeningList, ScreeningRow } from "./screening-view";

const TABS = {
  pagePath: "penilaian",
  tabs: [{ id: "mental_health", path: "mental", title: "Kesehatan mental" }],
  open: "mental",
};

const ROW: ScreeningRow = {
  studentId: "00000000-0000-4000-8000-000000000001",
  name: "Mahasiswa Contoh",
  nim: "9900000001",
  program: "Prodi Contoh",
  mentorName: "Pengasuh Contoh",
  instrument: "dass21",
  screenedOn: "2026-10-10",
  level: "extremely_severe",
  risk: true,
  consent: "waiting",
};

function counsellorPage(list: ScreeningList, query = ""): string {
  return renderToStaticMarkup(
    <ScreeningScreen
      tabs={TABS}
      counsellor={{
        numbers: { screened: 5, needCounselling: 4, waitingConsent: 1 },
        list,
        params: { query, filter: "all", page: 1 },
      }}
    />,
  );
}

describe("Kesehatan mental", () => {
  it("shows Keadaan darurat with what to do and 119 to every role that opens it", () => {
    const page = renderToStaticMarkup(
      <ScreeningScreen tabs={TABS} counsellor={null} />,
    );
    expect(page).toContain("Keadaan darurat.");
    expect(EMERGENCY_TEXT).toContain("119");
    expect(page).toContain(EMERGENCY_TEXT);
    expect(page).not.toContain("Daftar mahasiswa");
  });

  it("shows Konselor the three numbers", () => {
    const page = counsellorPage({ rows: [ROW], matching: 1, page: 1 });
    for (const label of [
      "Sudah diasesmen",
      "Perlu konseling",
      "Menunggu persetujuan",
    ]) {
      expect(page).toContain(label);
    }
    expect(page).toContain(">5<");
    expect(page).toContain(">4<");
  });

  it("lists each student with Pengasuh, the last instrument and date, Tingkat, Risiko, Persetujuan and Rincian", () => {
    const page = counsellorPage({ rows: [ROW], matching: 1, page: 1 });
    expect(page).toContain("Daftar mahasiswa");
    expect(page).toContain("Mahasiswa Contoh");
    expect(page).toContain("Pengasuh Contoh");
    expect(page).toContain("DASS-21, 10 Okt 2026");
    expect(page).toContain("Sangat berat");
    expect(page).toContain("Risiko");
    expect(page).toContain("Menunggu");
    expect(page).toContain("Rincian");
    expect(page).toContain("Perlu konseling</option>");
    expect(page).toContain("Menunggu persetujuan</option>");
    expect(page).toContain('aria-label="Cari nama atau NIM"');
    expect(page).toContain("1–1 dari 1 mahasiswa");
  });

  it("makes a card of each student on a phone", () => {
    const page = counsellorPage({ rows: [ROW], matching: 1, page: 1 });
    expect(page).toMatch(/<table class="[^"]*stacked/);
    expect(page).toContain('data-title="Tingkat"');
    expect(page).toContain('data-title="Persetujuan"');
  });

  it("says when nobody is screened, or nobody matches", () => {
    const empty = { rows: [], matching: 0, page: 1 };
    expect(counsellorPage(empty)).toContain(NOBODY_SCREENED);
    expect(counsellorPage(empty, "Bayu")).toContain(NOBODY_MATCHING);
  });
});

describe("Rincian", () => {
  it("shows each screening with its scores, level, advice and note", () => {
    const page = renderToStaticMarkup(
      <ScreeningHistory
        items={[
          {
            id: "a",
            screenedOn: "2026-10-10",
            instrument: "srq20",
            level: "moderate",
            scales: [],
            srqYes: 7,
            advice: "Konseling",
            risk: false,
            note: "Sulit tidur.",
          },
          {
            id: "b",
            screenedOn: "2026-10-01",
            instrument: "dass21",
            level: "severe",
            scales: [
              { scale: "depression", score: 22, level: "severe" },
              { scale: "anxiety", score: 10, level: "moderate" },
              { scale: "stress", score: 20, level: "moderate" },
            ],
            srqYes: null,
            advice: "Konseling segera",
            risk: false,
            note: "",
          },
        ]}
      />,
    );
    expect(page).toContain("Riwayat asesmen");
    expect(page).toContain("Skor SRQ-20: 7. Rekomendasi: Konseling.");
    expect(page).toContain("Sulit tidur.");
    expect(page).toContain(
      "Depresi 22 (berat) · Kecemasan 10 (sedang) · Stres 20 (sedang)",
    );
  });
});
