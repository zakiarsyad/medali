import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CounsellingScreen } from "./counselling-screen";
import type { CounsellorScheduleCard, ScheduleBoard } from "./schedule-view";
import { NEEDS_CONSENT } from "./session-words";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const CARD: CounsellorScheduleCard = {
  id: "00000000-0000-4000-8000-0000000c0551",
  name: "Mahasiswa Uji Layar",
  nim: "9937985051",
  program: "Prodi Uji Layar",
  status: "submitted",
  kind: "voluntary",
  topic: "emotions_and_stress",
  day: "2026-10-21",
  hour: "13:00",
  way: "in_person",
  story: "Cerita uji layar.",
  reason: "Bentrok uji layar.",
  basis: null,
  senderMessage: null,
  counsellorName: null,
  steps: [
    {
      id: "langkah-1",
      at: "19 Okt 2026, 10.00",
      by: "Mahasiswa Uji Layar",
      step: "register",
    },
  ],
  hasConsent: true,
  version: "2026-10-19T03:00:00.000Z",
};

function boardOf(cards: CounsellorScheduleCard[], matching = cards.length) {
  const board: ScheduleBoard = {
    counts: {
      toSchedule: 3,
      scheduledSoon: 2,
      proposed: 1,
      activeByKind: { voluntary: 4, assigned: 2, called: 1 },
    },
    cards,
    matching,
    page: 1,
  };
  return board;
}

function buttonsOf(page: string): string[] {
  return [...page.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(
    (match) => match[1] ?? "",
  );
}

function counsellorPage(board: ScheduleBoard, mayKeepSessions = false): string {
  return renderToStaticMarkup(
    <CounsellingScreen
      own={null}
      mayManage={true}
      mayKeepSessions={mayKeepSessions}
      schedules={{ board, filter: "needs_action", kind: null }}
    />,
  );
}

describe("Jadwal konseling of Konselor", () => {
  it("shows the numbers with what each counts, and the active ones per Jenis", () => {
    const page = counsellorPage(boardOf([CARD]));

    expect(page).toContain("Jadwal konseling");
    expect(page).toContain("permintaan dan penugasan");
    expect(page).toMatch(
      /Jenis<\/dt><dd[^>]*>Sukarela 4 · Penugasan 2 · Pemanggilan 1</,
    );
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
      "Selesai",
      "Tidak hadir",
      "Dibatalkan",
      "Semua",
    ]) {
      expect(page).toContain(`>${words}</option>`);
    }
    expect(page).toMatch(/<option value="perlu" selected="">/);
  });

  it("offers the Jenis filter with Semua jenis chosen", () => {
    const page = counsellorPage(boardOf([CARD]));

    expect(page).toContain('aria-label="Jenis"');
    for (const words of ["Sukarela", "Penugasan", "Pemanggilan"]) {
      expect(page).toContain(`>${words}</option>`);
    }
    expect(page).toMatch(/<option value="" selected="">Semua jenis<\/option>/);
  });

  it("shows on an assignment its Jenis, Menunggu jadwal, the Topik, Dasar and Pesan pengirim, and offers Tetapkan jadwal", () => {
    const card: CounsellorScheduleCard = {
      ...CARD,
      kind: "assigned",
      status: "awaiting",
      topic: "discipline_violation",
      day: null,
      hour: null,
      way: null,
      story: null,
      reason: null,
      basis: "Pelanggaran disiplin sedang jenjang pertama",
      senderMessage: "Pesan uji pengirim.",
    };
    const page = counsellorPage(boardOf([card]));

    for (const words of [
      ">Penugasan</span>",
      "Menunggu jadwal",
      "Pelanggaran disiplin",
      "Belum ada",
      ">Dasar<",
      "Pelanggaran disiplin sedang jenjang pertama",
      ">Pesan pengirim<",
      "Pesan uji pengirim.",
    ]) {
      expect(page).toContain(words);
    }
    expect(page).not.toContain(">Cara<");
    expect(buttonsOf(page)).toEqual(["Tetapkan jadwal"]);
  });

  it("offers Setujui waktu ini and Tetapkan jadwal on Minta jadwal ulang, with the reason", () => {
    const card: CounsellorScheduleCard = {
      ...CARD,
      kind: "called",
      status: "reschedule_asked",
      topic: "character_assessment",
      story: null,
      basis: "Asesmen karakter: pembinaan intensif",
      counsellorName: "Konselor Uji Layar",
    };
    const page = counsellorPage(boardOf([card]));

    expect(page).toContain(">Pemanggilan</span>");
    expect(page).toContain("Minta jadwal ulang");
    expect(page).toContain("Hasil asesmen karakter");
    expect(page).toContain("Alasan minta jadwal ulang");
    expect(buttonsOf(page)).toEqual(["Setujui waktu ini", "Tetapkan jadwal"]);
  });

  it("shows a card with the student, the status, Topik, the time asked, Cara, the story, the reason and Riwayat langkah", () => {
    const page = counsellorPage(boardOf([CARD]));

    for (const words of [
      "Mahasiswa Uji Layar",
      "9937985051 · Prodi Uji Layar",
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

  it("offers Setujui waktu ini and Usulkan waktu lain on a Diajukan request", () => {
    const page = counsellorPage(boardOf([CARD]));

    expect(buttonsOf(page)).toEqual([
      "Setujui waktu ini",
      "Usulkan waktu lain",
    ]);
  });

  it("offers Tandai selesai, Tidak hadir and Ubah jadwal on a Dijadwalkan session", () => {
    const card = {
      ...CARD,
      status: "scheduled" as const,
      counsellorName: "Konselor Uji Layar",
    };

    expect(buttonsOf(counsellorPage(boardOf([card])))).toEqual([
      "Tandai selesai",
      "Tidak hadir",
      "Ubah jadwal",
    ]);
  });

  it.each(["proposed", "done", "missed", "cancelled"] as const)(
    "offers nothing on a request that is %s",
    (status) => {
      const card = { ...CARD, status, counsellorName: "Konselor Uji Layar" };
      expect(buttonsOf(counsellorPage(boardOf([card])))).toEqual([]);
    },
  );

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

  it("says on a Dijadwalkan card that consent is needed first while it is not Disetujui", () => {
    const card: CounsellorScheduleCard = {
      ...CARD,
      kind: "assigned",
      status: "scheduled",
      topic: "discipline_violation",
      basis: "Pelanggaran disiplin ringan jenjang pertama",
      counsellorName: "Konselor Uji Layar",
      hasConsent: false,
    };

    expect(counsellorPage(boardOf([card]), true)).toContain(NEEDS_CONSENT);
    expect(
      counsellorPage(boardOf([{ ...card, hasConsent: true }]), true),
    ).not.toContain(NEEDS_CONSENT);
  });
});
