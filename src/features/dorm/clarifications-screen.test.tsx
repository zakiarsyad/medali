import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DormClarificationCard } from "./clarification-card";
import type { ClarificationBoard } from "./clarification-list";
import {
  type ClarificationRights,
  ClarificationsScreen,
} from "./clarifications-screen";
import { OWN_RECORD_NOTE } from "./own-record";

vi.mock("./clarification-actions", () => ({
  verifyDormClarificationAction: vi.fn(),
  decideDormClarificationAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));

const ANI = "00000000-0000-4000-8000-0000000000a1";

const CARD: DormClarificationCard = {
  id: "00000000-0000-4000-8000-00000000c1a3",
  studentId: ANI,
  sentAt: "2026-10-13T05:00:00.000Z",
  name: "Penghuni Uji Layar",
  nim: "9937980901",
  room: "Asrama Dana Rakca, kamar 101",
  activity: "Apel pagi uji",
  held: "13 Okt 2026, 05:30–06:15",
  reason: "Sakit",
  explanation: "Demam dan beristirahat di kamar.",
  status: "verified",
  hasFile: true,
  removed: null,
  file: { name: "surat-dokter.pdf", isPdf: true, facts: "Dokumen PDF · 2 KB" },
  sent: "13 Okt 2026, 12.00",
  verification: {
    result: "Diterima BAM: Dikonfirmasi ketua kamar.",
    by: "(BAM Uji, 13 Okt 2026, 14.00)",
  },
  decision: null,
};

const BOARD: ClarificationBoard = {
  counts: { submitted: 3, verified: 1, accepted: 4, rejected: 2 },
  list: { cards: [CARD], matching: 1, page: 1 },
};

const READS_ONLY: ClarificationRights = { verify: false, decide: false };

function screen(
  board: ClarificationBoard = BOARD,
  rights: ClarificationRights = { verify: true, decide: false },
  status: "all" | "closed" = "all",
  ownStudentId: string | null = null,
): string {
  return renderToStaticMarkup(
    <ClarificationsScreen
      tabs={{ pagePath: "asrama", tabs: [], open: "klar" }}
      params={{ filters: { query: "", status }, page: 1 }}
      board={board}
      rights={rights}
      ownStudentId={ownStudentId}
    />,
  );
}

describe("ClarificationsScreen", () => {
  it("is titled Asrama, the page the tab belongs to, as every tab of it is", () => {
    expect(screen()).toMatch(/<h1[^>]*>Asrama<\/h1>/);
  });

  it("shows the four numbers, the flow, the search and the status choice", () => {
    const shown = screen();

    for (const [label, amount] of [
      ["Menunggu verifikasi BAM", 3],
      ["Menunggu validasi pengelola", 1],
      ["Diterima", 4],
      ["Ditolak", 2],
    ]) {
      expect(shown).toContain(`${label}</dt><dd`);
      expect(shown).toContain(`>${amount}</dd>`);
    }
    expect(shown).toContain(
      "Alur: BAM mengumumkan ketidakhadiran, mahasiswa mengajukan klarifikasi",
    );
    expect(shown).toContain('placeholder="Cari nama atau NIM"');
    for (const words of [
      "Semua status",
      "Diajukan",
      "Diverifikasi BAM",
      "Diterima",
      "Ditolak",
      "Ditutup",
    ]) {
      expect(shown).toContain(`>${words}</option>`);
    }
  });

  it("shows a card with the resident, the room, the activity, Alasan, Penjelasan, Lampiran and the check of BAM with who and when", () => {
    const shown = screen();

    expect(shown).toContain("<b>Penghuni Uji Layar</b>");
    expect(shown).toContain("9937980901 · Asrama Dana Rakca, kamar 101");
    expect(shown).toContain("Diverifikasi BAM</span>");
    expect(shown).toContain("Apel pagi uji");
    expect(shown).toContain("13 Okt 2026, 05:30–06:15");
    expect(shown).toContain("<dt>Alasan</dt><dd>Sakit</dd>");
    expect(shown).toContain("Demam dan beristirahat di kamar.");
    expect(shown).toMatch(
      /<dt>Lampiran<\/dt><dd><button[^>]*>surat-dokter\.pdf<\/button>/,
    );
    expect(shown).toContain("Diterima BAM: Dikonfirmasi ketua kamar.");
    expect(shown).toContain("(BAM Uji, 13 Okt 2026, 14.00)");
  });

  it("tells a role that only reads that there is a file, without its name, and that it only reads", () => {
    const card = { ...CARD, file: null };
    const shown = screen(
      { ...BOARD, list: { ...BOARD.list, cards: [card] } },
      READS_ONLY,
    );

    expect(shown).toContain("<dt>Lampiran</dt><dd>Terlampir</dd>");
    expect(shown).not.toContain("surat-dokter.pdf");
    expect(shown).toContain("Anda dapat melihat rekap dan rinciannya.");
  });

  it("says when the file was removed as old proof, in place of its name", () => {
    const removed = "Berkas sudah dihapus pada 1 Apr 2027.";
    const card = { ...CARD, hasFile: false, file: null, removed };
    const shown = screen({ ...BOARD, list: { ...BOARD.list, cards: [card] } });

    expect(shown).toContain(`<dt>Lampiran</dt><dd>${removed}</dd>`);
    expect(shown).not.toContain("surat-dokter.pdf");
  });

  it("does not say so to a role that checks or decides", () => {
    expect(screen()).not.toContain("Anda dapat melihat rekap");
    expect(screen(BOARD, { verify: false, decide: true })).not.toContain(
      "Anda dapat melihat rekap",
    );
  });

  it("says when no card matches the status chosen, without a pager", () => {
    const empty = { ...BOARD, list: { cards: [], matching: 0, page: 1 } };

    const shown = screen(empty, READS_ONLY, "closed");

    expect(shown).toContain("Tidak ada klarifikasi yang ditutup.");
    expect(shown).not.toContain("Berikutnya");
  });
});

describe("the presses on a card", () => {
  function withStatus(status: DormClarificationCard["status"]) {
    return { ...BOARD, list: { ...BOARD.list, cards: [{ ...CARD, status }] } };
  }

  it("offers BAM to pass on or reject one that waits for it", () => {
    const shown = screen(withStatus("submitted"), {
      verify: true,
      decide: false,
    });

    expect(shown).toContain(
      'placeholder="Catatan verifikasi (wajib bila ditolak)"',
    );
    expect(shown).toContain(">Terima, teruskan ke pengelola</button>");
    expect(shown).toContain(">Tolak klarifikasi</button>");
    expect(shown).not.toContain("Terima sebagai hadir");
  });

  it("offers Pengelola Asrama to accept as present or as leave, or reject, once BAM passed it on", () => {
    const shown = screen(withStatus("verified"), {
      verify: false,
      decide: true,
    });

    expect(shown).toContain(">Terima sebagai hadir</button>");
    expect(shown).toContain(">Terima sebagai izin</button>");
    expect(shown).toContain(">Tolak</button>");
    expect(shown).not.toContain("Terima, teruskan ke pengelola");
  });

  it("tells Pengelola Asrama that one still waits for BAM, with nothing to press", () => {
    const shown = screen(withStatus("submitted"), {
      verify: false,
      decide: true,
    });

    expect(shown).toContain(
      "Menunggu verifikasi Badan Asrama Mahasiswa sebelum dapat divalidasi.",
    );
    expect(shown).not.toContain('aria-label="Catatan"');
  });

  it("shows a resident who is also BAM the line in place of the check on their own clarification, with the key in capitals too", () => {
    const bam = { verify: true, decide: false };
    for (const own of [ANI, ANI.toUpperCase()]) {
      const shown = screen(withStatus("submitted"), bam, "all", own);

      expect(shown).toContain("<b>Penghuni Uji Layar</b>");
      expect(shown).toContain(OWN_RECORD_NOTE);
      expect(shown).not.toContain("Terima, teruskan ke pengelola");
      expect(shown).not.toContain("Tolak klarifikasi");
    }
  });

  it("offers a resident who is also BAM the check of another resident's clarification", () => {
    const other = "00000000-0000-4000-8000-0000000000b2";
    const shown = screen(
      withStatus("submitted"),
      { verify: true, decide: false },
      "all",
      other,
    );

    expect(shown).toContain(">Terima, teruskan ke pengelola</button>");
    expect(shown).not.toContain(OWN_RECORD_NOTE);
  });

  it("offers a role that only reads nothing to press", () => {
    const shown = screen(withStatus("verified"), READS_ONLY);

    expect(shown).not.toContain("Terima");
    expect(shown).not.toContain("Tolak");
  });
});
