import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LeaveCard } from "./leave-card";
import { cardAfter, LeaveCards, type LeaveRights } from "./leave-cards";
import type { ReportCard } from "./return-card";

vi.mock("./leave-actions", () => ({
  decideLeaveAction: vi.fn(),
  verifyReturnAction: vi.fn(),
  validateReturnAction: vi.fn(),
}));

const REPORT: ReportCard = {
  id: "00000000-0000-4000-8000-0000000000b1",
  hasPhoto: true,
  status: "waiting",
  sentAt: "14 Okt 2026, 16.12",
  timeliness: { late: true, words: "Terlambat 12 menit" },
  verification: null,
  validation: null,
};

const CARD: LeaveCard = {
  id: "00000000-0000-4000-8000-0000000000c1",
  kind: "outing",
  status: "approved",
  start: "14 Okt 2026, 09.00",
  end: "14 Okt 2026, 16.00",
  length: "7 jam",
  purpose: "Membeli buku kuliah",
  destination: "Bintaro",
  contact: "0812",
  decisionNote: "",
  covered: [],
  name: "Penghuni Contoh",
  nim: "9900000001",
  room: "Asrama Dana Rakca, kamar 101",
  decision: { by: "Pengelola Contoh", note: "" },
  warnings: [],
  report: REPORT,
};

const NONE: LeaveRights = { decide: false, verify: false, validate: false };
const BAM: LeaveRights = { ...NONE, verify: true };
const MANAGER: LeaveRights = { ...NONE, decide: true, validate: true };

function shown(card: LeaveCard, rights: LeaveRights): string {
  return renderToStaticMarkup(
    <LeaveCards cards={[card]} rights={rights} emptyWords="Kosong" />,
  );
}

function withReport(more: Partial<ReportCard>): LeaveCard {
  return { ...CARD, report: { ...REPORT, ...more } };
}

describe("the report of a return on a card", () => {
  it("shows the photo, when it was sent, where it stands and how late", () => {
    const card = shown(CARD, NONE);

    expect(card).toContain(`src="/asrama/izin/foto/${REPORT.id}"`);
    expect(card).toContain("Lapor kembali 14 Okt 2026, 16.12");
    expect(card).toContain(">Menunggu verifikasi BAM</span>");
    expect(card).toContain(">Terlambat 12 menit</span>");
  });

  it("offers Verifikasi and Tolak to BAM - BPHK on a report that waits for BAM", () => {
    const card = shown(CARD, BAM);

    expect(card).toContain(">Verifikasi</button>");
    expect(card).toContain(">Tolak</button>");
    expect(card).not.toContain("Validasi kembali");
  });

  it("tells Pengelola Asrama that a report waits for BAM, and offers Validasi kembali once BAM verified", () => {
    const waiting = shown(CARD, MANAGER);
    const verified = shown(
      withReport({
        status: "verified",
        verification: { by: "Bima BAM", result: "Diverifikasi", note: "" },
      }),
      MANAGER,
    );

    expect(waiting).toContain("Menunggu verifikasi Badan Asrama Mahasiswa.");
    expect(waiting).not.toContain(">Validasi kembali</button>");
    expect(verified).toContain(">Validasi kembali</button>");
    expect(verified).toContain("BAM: Diverifikasi (Bima BAM)");
  });

  it("shows both decisions and who made them, and offers nothing to a role that only reads", () => {
    const card = shown(
      withReport({
        status: "validated",
        verification: { by: "Bima BAM", result: "Diverifikasi", note: "Jelas" },
        validation: { by: "Pak Pengelola", result: "Divalidasi", note: "" },
      }),
      NONE,
    );

    expect(card).toContain("BAM: Diverifikasi · Jelas (Bima BAM)");
    expect(card).toContain("Pengelola: Divalidasi (Pak Pengelola)");
    expect(card).not.toContain("<button");
  });

  it("says where no photo was kept", () => {
    expect(shown(withReport({ hasPhoto: false }), NONE)).toContain(
      "Foto tidak tersimpan di sini.",
    );
  });
});

describe("cardAfter", () => {
  it("makes leave Selesai once its report is validated here", () => {
    const after = cardAfter(CARD, null, "validated");

    expect(after.status).toBe("completed");
    expect(after.report?.status).toBe("validated");
  });

  it("keeps the leave as it is after a rejected report", () => {
    const after = cardAfter(CARD, null, "rejected");

    expect(after.status).toBe("approved");
    expect(after.report?.status).toBe("rejected");
  });
});
