// Sample NIMs of this file: 9988600600 to 9988600699.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EMERGENCY_TEXT } from "./counselling-screen";
import { CampusScreenedCount, PERSONAL_DATA_NOTE } from "./screening-campus";
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
  nim: "9988600601",
  program: "Prodi Contoh",
  mentorName: "Pengasuh Contoh",
  instrument: "dass21",
  screenedOn: "2026-10-10",
  level: "extremely_severe",
  risk: true,
  consent: "waiting",
  sessions: 2,
  nextDay: "2026-10-27",
  sharing: "published",
};

function counsellorPage(list: ScreeningList, query = ""): string {
  return renderToStaticMarkup(
    <ScreeningScreen
      tabs={TABS}
      counsellor={{
        numbers: { screened: 5, needCounselling: 4, waitingConsent: 1 },
        list,
        params: {
          query,
          filter: "all",
          page: 1,
          sharedPage: 1,
          profileId: null,
        },
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
    expect(page).toContain('data-title="Konseling"');
    expect(page).toContain('data-title="Publikasi"');
  });

  it("shows Konseling and Publikasi as the list on Konseling does, and the filter Disetujui", () => {
    const page = counsellorPage({ rows: [ROW], matching: 1, page: 1 });
    expect(page).toContain("2 sesi, berikutnya 27 Okt 2026");
    expect(page).toContain("Dipublikasikan");
    expect(page).toContain('<option value="disetujui">Disetujui</option>');
    const none = counsellorPage({
      rows: [{ ...ROW, sessions: 0, nextDay: null, sharing: null }],
      matching: 1,
      page: 1,
    });
    expect(none).not.toContain(" sesi");
    expect(none).not.toContain("Dipublikasikan");
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

describe("Kesehatan mental of Kepala Unit, Direktur, Ketua Program Studi and Pengasuh", () => {
  it("shows the campus count as sent, with the note on personal data, and no list or form", () => {
    const page = renderToStaticMarkup(
      <ScreeningScreen
        tabs={TABS}
        counsellor={null}
        others={<CampusScreenedCount shown="<5" />}
      />,
    );
    expect(page).toContain("Keadaan darurat.");
    expect(page).toContain("Sudah diasesmen");
    expect(page).toContain("&lt;5");
    expect(page).toContain(PERSONAL_DATA_NOTE);
    expect(PERSONAL_DATA_NOTE).toContain(
      "hanya tampil bila konselor mempublikasikannya dengan persetujuan mahasiswa",
    );
    expect(page).not.toContain("Daftar mahasiswa");
    expect(page).not.toContain("Simpan asesmen");
    expect(page).not.toContain("Perlu konseling");
  });
});

describe("names in Konselor's Daftar mahasiswa", () => {
  it("open the student's profile over the tab", () => {
    const page = counsellorPage({ rows: [ROW], matching: 1, page: 1 });

    expect(page).toContain(
      'href="/penilaian/mental?profil=00000000-0000-4000-8000-000000000001"',
    );
  });
});
