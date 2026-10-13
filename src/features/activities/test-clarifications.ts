import type { ClarificationCard } from "./clarification-card";
import type { Clarifications } from "./clarifications";

/* Made-up screen data for the checks of the tab "Klarifikasi kehadiran". */

/** A clarification that waits, of a made-up student, with a PDF. */
export const TEST_CLARIFICATION: ClarificationCard = {
  id: "00000000-0000-4000-8000-0000000000d1",
  sentAt: "2026-10-13T05:00:00.000Z",
  name: "Mahasiswa Uji Klarifikasi",
  nim: "8800000011",
  program: "Akuntansi uji",
  activity: "Latihan dasar kepemimpinan uji",
  held: "10 Okt 2026, 07:30–11:30",
  reason: "Sakit",
  status: "submitted",
  sent: "13 Okt 2026, 12.00",
  decision: null,
  explanation: "Demam sejak malam sebelum kegiatan.",
  file: {
    name: "surat-keterangan.pdf",
    isPdf: true,
    facts: "Dokumen PDF · 12 KB",
  },
};

/** The tab with nothing sent yet, at Diajukan. */
export const TEST_NO_CLARIFICATIONS: Clarifications = {
  counts: { submitted: 0, accepted: 0, rejected: 0 },
  filters: { query: "", status: "submitted" },
  askedPage: 1,
  list: { cards: [], matching: 0, page: 1 },
};
