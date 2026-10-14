import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  GAIN_CANCELLED_NOTE,
  NO_REQUESTS,
  OwnRequestList,
} from "./own-request-list";
import type { OwnRequest } from "./own-requests";
import { OwnSikuScreen } from "./own-siku-screen";
import { PHOTO_NOT_KEPT } from "./request-photo-thumbs";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

const WAITING: OwnRequest = {
  id: "00000000-0000-4000-8000-000000000301",
  reason: "knowledge_sharing",
  day: "2026-10-12",
  report: "Mengisi sesi berbagi pengetahuan literasi keuangan.",
  sentAt: new Date("2026-10-13T12:00:00Z"),
  status: "waiting",
  points: null,
  decidedAs: null,
  decidedAt: null,
  note: "",
  photos: [
    { id: "00000000-0000-4000-8000-000000000311", isKept: true },
    { id: "00000000-0000-4000-8000-000000000312", isKept: false },
  ],
};

const APPROVED: OwnRequest = {
  ...WAITING,
  id: "00000000-0000-4000-8000-000000000302",
  status: "approved",
  points: 3,
  decidedAs: "assessor",
  decidedAt: new Date("2026-10-14T03:00:00Z"),
  note: "Laporan sesuai.",
  photos: [],
};

const CANCELLED: OwnRequest = {
  ...APPROVED,
  id: "00000000-0000-4000-8000-000000000303",
  status: "cancelled",
  decidedAs: "head_of_unit",
};

describe("Pengajuan saya", () => {
  it("says so when there is no request", () => {
    const html = renderToStaticMarkup(<OwnRequestList requests={[]} />);

    expect(html).toContain("Pengajuan saya");
    expect(html).toContain(NO_REQUESTS);
  });

  it("shows a waiting request as Diajukan with its photos small, loaded lazily, and Tarik pengajuan", () => {
    const html = renderToStaticMarkup(<OwnRequestList requests={[WAITING]} />);

    expect(html).toContain("Diajukan");
    expect(html).toContain("Melakukan sosialisasi/knowledge sharing");
    expect(html).toContain("12 Okt 2026");
    expect(html).toContain("Diajukan 13 Okt 2026, 19.00");
    expect(html).toContain(
      'src="/penilaian/siku/foto/00000000-0000-4000-8000-000000000311?ukuran=kecil"',
    );
    expect(html).toContain('loading="lazy"');
    expect(html).toContain(PHOTO_NOT_KEPT);
    expect(html).toContain("Tarik pengajuan");
  });

  it("shows an approved request with its points, the role that checked it and when, and the note, without Tarik pengajuan", () => {
    const html = renderToStaticMarkup(<OwnRequestList requests={[APPROVED]} />);

    expect(html).toContain("Disetujui +3");
    expect(html).toContain("diperiksa Penilai Mahasiswa, 14 Okt 2026, 10.00");
    expect(html).toContain("Catatan penilai: Laporan sesuai.");
    expect(html).not.toContain("Tarik pengajuan");
  });

  it("shows a request whose gain was cancelled as Dibatalkan, and says so", () => {
    const html = renderToStaticMarkup(
      <OwnRequestList requests={[CANCELLED]} />,
    );

    expect(html).toContain("Dibatalkan");
    expect(html).not.toContain("+3");
    expect(html).toContain("Kepala Unit Pembangunan Karakter");
    expect(html).toContain(GAIN_CANCELLED_NOTE);
  });
});

describe("SIKU akhir of a student who may ask", () => {
  const screen = (requests: { panels: null; waiting: number } | null) =>
    renderToStaticMarkup(
      <OwnSikuScreen
        tabs={{ pagePath: "penilaian", tabs: [], open: "siku" }}
        base={70}
        siku={{ totals: { gains: 0, losses: 0 }, entries: [] }}
        requests={requests}
      />,
    );

  it("says how many requests wait, or that none does", () => {
    expect(screen({ panels: null, waiting: 2 })).toContain(
      "2 pengajuan menunggu",
    );
    expect(screen({ panels: null, waiting: 0 })).toContain(
      "tidak ada pengajuan menunggu",
    );
    expect(screen(null)).toContain("nilai dasar + penambahan − pengurangan");
  });
});
