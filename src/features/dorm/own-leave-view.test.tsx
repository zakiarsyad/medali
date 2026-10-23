import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { type LeaveListParams, readLeaveListParams } from "./leave-address";
import type { OwnLeave, OwnLeaveRow } from "./own-leave";
import { historyKey, OwnLeaveTable, saidAfterCancel } from "./own-leave-view";

vi.mock("./leave-actions", () => ({
  cancelLeaveAction: vi.fn(),
  sendReturnReportAction: vi.fn(),
}));

const ROW: OwnLeaveRow = {
  id: "00000000-0000-4000-8000-00000000c001",
  kind: "outing",
  status: "submitted",
  start: "15 Okt 2026, 09.00",
  end: "15 Okt 2026, 15.00",
  length: "6 jam",
  purpose: "Membeli buku kuliah",
  destination: "Bintaro",
  contact: "",
  decisionNote: "",
  covered: [],
  return: { kind: "none" },
};

const APPROVED: OwnLeaveRow = { ...ROW, status: "approved" };

function leaveOf(rows: OwnLeaveRow[]): OwnLeave {
  return { dorm: "dana_rakca", rows, matching: rows.length, page: 1 };
}

function table(
  rows: OwnLeaveRow[],
  said: string | null,
  openId: string | null = null,
): string {
  return renderToStaticMarkup(
    <OwnLeaveTable
      leave={leaveOf(rows)}
      said={said}
      reporting={{
        openId,
        newReportId: "00000000-0000-4000-8000-00000000c0ff",
        onOpen: () => undefined,
        onSent: () => undefined,
      }}
      onCancelled={() => undefined}
      staffList={null}
    />,
  );
}

describe("what a cancel leaves above Riwayat izin saya", () => {
  it("is said only after a cancel that was kept, so a refused one clears it", () => {
    expect(
      saidAfterCancel({ error: null, done: "Pengajuan dibatalkan." }),
    ).toBe("Pengajuan dibatalkan.");
    expect(
      saidAfterCancel({ error: "Izin ini sudah disetujui.", done: null }),
    ).toBeNull();
  });

  it("is dropped on another page of the list and once a new request is kept, but not by the cancel itself", () => {
    const now = leaveOf([ROW]);

    expect(historyKey({ ...now, page: 2 })).not.toBe(historyKey(now));
    expect(historyKey({ ...now, matching: 2 })).not.toBe(historyKey(now));
    expect(
      historyKey({ ...now, rows: [{ ...ROW, status: "cancelled" }] }),
    ).toBe(historyKey(now));
  });
});

describe("the pages of Riwayat izin saya", () => {
  function pagerOf(staffList: LeaveListParams | null): string {
    return renderToStaticMarkup(
      <OwnLeaveTable
        leave={{ ...leaveOf([ROW]), matching: 100 }}
        said={null}
        reporting={{
          openId: null,
          newReportId: "00000000-0000-4000-8000-00000000c0ff",
          onOpen: () => undefined,
          onSent: () => undefined,
        }}
        onCancelled={() => undefined}
        staffList={staffList}
      />,
    );
  }

  it("keep the place of the staff list shown below", () => {
    const staffList = readLeaveListParams({ status: "semua", hal: "3" });

    expect(pagerOf(staffList)).toContain(
      'href="/asrama/izin?status=semua&amp;hal=3&amp;riwayat=2"',
    );
  });

  it("name only their own page for a resident alone", () => {
    expect(pagerOf(null)).toContain('href="/asrama/izin?riwayat=2"');
  });
});

describe("Riwayat izin saya", () => {
  it("offers Batalkan on a request that waits", () => {
    expect(table([ROW], null)).toContain(">Batalkan</button>");
  });

  it("keeps Pengajuan dibatalkan. above the list once the row is Dibatalkan and its button is gone", () => {
    const shown = table(
      [{ ...ROW, status: "cancelled" }],
      "Pengajuan dibatalkan.",
    );

    expect(shown).toContain("Pengajuan dibatalkan.");
    expect(shown).toContain(">Dibatalkan</span>");
    expect(shown).not.toContain(">Batalkan</button>");
  });
});

describe("the return from leave in Riwayat izin saya", () => {
  it("says when the report opens, before that", () => {
    const shown = table(
      [{ ...APPROVED, return: { kind: "opens", at: "15 Okt 2026, 14.30" } }],
      null,
    );

    expect(shown).toContain("Lapor kembali dibuka 15 Okt 2026, 14.30");
    expect(shown).not.toContain("Lapor kembali ke asrama");
  });

  it("offers Lapor kembali ke asrama once it opens, and after a rejection with its note", () => {
    const open = table(
      [{ ...APPROVED, return: { kind: "open", rejectionNote: null } }],
      null,
    );
    const rejected = table(
      [
        {
          ...APPROVED,
          return: { kind: "open", rejectionNote: "Foto buram." },
        },
      ],
      null,
    );

    expect(open).toContain(">Lapor kembali ke asrama</button>");
    expect(rejected).toContain("Laporan kembali ditolak: Foto buram.");
    expect(rejected).toContain(">Lapor kembali ke asrama</button>");
  });

  it("shows a report that waits as Menunggu verifikasi BAM, with how late and when it was sent", () => {
    const shown = table(
      [
        {
          ...APPROVED,
          return: {
            kind: "sent",
            status: "waiting",
            sentAt: "15 Okt 2026, 15.12",
            timeliness: { late: true, words: "Terlambat 12 menit" },
          },
        },
      ],
      null,
    );

    expect(shown).toContain(">Menunggu verifikasi BAM</span>");
    expect(shown).toContain(">Terlambat 12 menit</span>");
    expect(shown).toContain("Lapor 15 Okt 2026, 15.12");
  });

  it("shows the actual return of leave that is Selesai", () => {
    const shown = table(
      [
        {
          ...ROW,
          status: "completed",
          return: {
            kind: "back",
            returnedAt: "15 Okt 2026, 14.50",
            timeliness: { late: false, words: "Tepat waktu" },
          },
        },
      ],
      null,
    );

    expect(shown).toContain(">Selesai</span>");
    expect(shown).toContain("Kembali 15 Okt 2026, 14.50");
    expect(shown).toContain(">Tepat waktu</span>");
  });

  it("opens the camera under the request, with the return time and only Buka kamera to take a photo", () => {
    const shown = table(
      [{ ...APPROVED, return: { kind: "open", rejectionNote: null } }],
      null,
      APPROVED.id,
    );

    expect(shown).toContain("Batas kembali <b>15 Okt 2026, 15.00</b>");
    expect(shown).toContain(">Buka kamera</button>");
    expect(shown).not.toContain('type="file"');
    expect(shown).not.toContain(">Lapor kembali ke asrama</button>");
  });
});
