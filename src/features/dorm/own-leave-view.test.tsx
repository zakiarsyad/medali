import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LeaveRow } from "./leave-row";
import type { OwnLeave } from "./own-leave";
import { historyKey, OwnLeaveTable, saidAfterCancel } from "./own-leave-view";

vi.mock("./leave-actions", () => ({ cancelLeaveAction: vi.fn() }));

const ROW: LeaveRow = {
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
};

function leaveOf(rows: LeaveRow[]): OwnLeave {
  return { dorm: "dana_rakca", rows, matching: rows.length, page: 1 };
}

function table(rows: LeaveRow[], said: string | null): string {
  return renderToStaticMarkup(
    <OwnLeaveTable
      leave={leaveOf(rows)}
      said={said}
      onCancelled={() => undefined}
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
