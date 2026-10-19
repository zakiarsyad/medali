import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CounsellingScreen } from "./counselling-screen";
import type { CounsellorScheduleCard, ScheduleBoard } from "./schedule-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const CARD: CounsellorScheduleCard = {
  id: "00000000-0000-4000-8000-0000000c0551",
  name: "Mahasiswa Uji Layar",
  nim: "9937980951",
  program: "Prodi Uji Layar",
  status: "submitted",
  topic: "emotions_and_stress",
  day: "2026-10-21",
  hour: "13:00",
  way: "in_person",
  story: "Cerita uji layar.",
  reason: "Bentrok uji layar.",
  counsellorName: null,
  steps: [
    {
      id: "langkah-1",
      at: "19 Okt 2026, 10.00",
      by: "Mahasiswa Uji Layar",
      step: "register",
    },
  ],
  version: "2026-10-19T03:00:00.000Z",
};

function boardOf(cards: CounsellorScheduleCard[], matching = cards.length) {
  const board: ScheduleBoard = {
    counts: { submitted: 3, scheduledSoon: 2, proposed: 1 },
    cards,
    matching,
    page: 1,
  };
  return board;
}

function counsellorPage(board: ScheduleBoard): string {
  return renderToStaticMarkup(
    <CounsellingScreen
      own={null}
      mayManage={true}
      schedules={{ board, filter: "needs_action" }}
    />,
  );
}

describe("Jadwal konseling of Konselor", () => {
  it("shows the three numbers with what each counts", () => {
    const page = counsellorPage(boardOf([CARD]));

    expect(page).toContain("Jadwal konseling");
    expect(page).toMatch(/Perlu dijadwalkan<\/dt><dd[^>]*>3</);
    expect(page).toMatch(/Dijadwalkan 7 hari ke depan<\/dt><dd[^>]*>2</);
    expect(page).toMatch(/Menunggu konfirmasi mahasiswa<\/dt><dd[^>]*>1</);
  });

  it("offers the Status filter with Perlu ditindaklanjuti chosen", () => {
    const page = counsellorPage(boardOf([CARD]));

    expect(page).toContain('aria-label="Status"');
    for (const words of [
      "Perlu ditindaklanjuti",
      "Semua yang aktif",
      "Dijadwalkan",
      "Semua",
    ]) {
      expect(page).toContain(`>${words}</option>`);
    }
    expect(page).toMatch(/<option value="perlu" selected="">/);
  });

  it("shows a card with the student, the status, Topik, the time asked, Cara, the story, the reason and Riwayat langkah", () => {
    const page = counsellorPage(boardOf([CARD]));

    for (const words of [
      "Mahasiswa Uji Layar",
      "9937980951 · Prodi Uji Layar",
      "Diajukan",
      "Emosi dan stres",
      "Waktu yang diminta",
      "21 Okt 2026 pukul 13:00",
      "Tatap muka di Ruang Konseling",
      "Cerita mahasiswa (rahasia)",
      "Cerita uji layar.",
      "Alasan minta jadwal ulang",
      "Bentrok uji layar.",
      "Riwayat langkah",
      "19 Okt 2026, 10.00 · Mahasiswa Uji Layar · Mendaftar konseling",
    ]) {
      expect(page).toContain(words);
    }
  });

  it("names the Konselor of a Dijadwalkan request", () => {
    const scheduled = {
      ...CARD,
      status: "scheduled" as const,
      counsellorName: "Konselor Uji Layar",
    };
    const page = counsellorPage(boardOf([scheduled]));

    expect(page).toContain("Konselor Uji Layar");
  });

  it("says Tidak ada konseling pada filter ini. with no card, and shows no pager", () => {
    const page = counsellorPage(boardOf([]));

    expect(page).toContain("Tidak ada konseling pada filter ini.");
    expect(page).not.toContain("Berikutnya");
  });

  it("steps to the next 20 cards when there are more", () => {
    const page = counsellorPage(boardOf([CARD], 21));

    expect(page).toContain("1–20 dari 21 permintaan");
    expect(page).toContain('href="/konseling?hal=2"');
  });

  it("is not shown to an account without the right", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={false} schedules={null} />,
    );

    expect(page).not.toContain("Jadwal konseling");
  });
});
