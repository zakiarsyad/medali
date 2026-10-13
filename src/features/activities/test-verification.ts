import type { Verification } from "./verification";
import type { VerificationCard } from "./verification-card";

/* Made-up screen data for the checks of the tab "Verifikasi presensi". */

/** A photo that waits, of a made-up student. */
export const TEST_CARD: VerificationCard = {
  id: "00000000-0000-4000-8000-0000000000c1",
  sentAt: "2026-10-13T05:00:00.000Z",
  name: "Mahasiswa Uji Kartu",
  nim: "8800000001",
  program: "Akuntansi uji",
  activity: "Latihan dasar kepemimpinan uji",
  sent: "Dikirim 13 Okt 2026, 12.00",
  isOutsideDates: false,
  hasPhoto: true,
  status: "waiting",
  note: "",
  decidedBy: null,
};

/** The tab with nothing sent yet, at Menunggu verifikasi. */
export const TEST_EMPTY_VERIFICATION: Verification = {
  numbers: { waiting: 0, validToday: 0, rejected: 0, heldToday: 0, openNow: 0 },
  choices: [],
  filters: { scheduleId: null, status: "waiting" },
  list: { cards: [], matching: 0, page: 1 },
};
