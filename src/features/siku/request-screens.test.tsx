import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  GAIN_CANCELLED_NOTE,
  NO_REQUESTS,
  OwnRequestList,
  WITHDRAW_NOT_SENT,
  withdrawnOr,
} from "./own-request-list";
import type { OwnRequest } from "./own-requests";
import { OwnSikuScreen } from "./own-siku-screen";
import type { RequestBoard, RequestCard } from "./request-board";
import { SAME_GAIN_WARNING } from "./request-card-view";
import { RequestCards } from "./request-cards";
import {
  DECIDER_REQUESTS,
  NO_REQUESTS_HERE,
  READ_ONLY_REQUESTS,
  RequestPanel,
} from "./request-panel";
import { PHOTO_NOT_KEPT } from "./request-photo-thumbs";
import { START_PARAMS } from "./siku-address";

vi.mock("next/navigation", () => ({
  useRouter: () => ({}),
  unstable_rethrow: () => {},
}));

describe("Tarik pengajuan", () => {
  it("says it was not sent when the connection drops, instead of failing", async () => {
    const answer = await withdrawnOr(async () => {
      throw new Error("Tidak ada koneksi.");
    });

    expect(answer).toEqual({ error: WITHDRAW_NOT_SENT, done: null });
  });

  it("gives what the server answered", async () => {
    const done = { error: null, done: "Pengajuan ditarik." };

    expect(await withdrawnOr(async () => done)).toEqual(done);
  });
});

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

const CARD: RequestCard = {
  id: "00000000-0000-4000-8000-000000000401",
  name: "Ayu Contoh",
  nim: "9900230001",
  program: "D3 Akuntansi",
  reason: "peer_mentoring",
  day: "2026-10-12",
  report: "Membimbing dua mahasiswa lain menyiapkan ujian.",
  sentAt: new Date("2026-10-13T12:00:00Z"),
  status: "waiting",
  points: null,
  decidedBy: null,
  decidedAs: null,
  decidedAt: null,
  note: "",
  hasSameGain: false,
  photos: [{ id: "00000000-0000-4000-8000-000000000411", isKept: true }],
};

const BOARD: RequestBoard = {
  counts: { waiting: 1, approved: 4, rejected: 2, all: 8 },
  cards: [CARD],
  matching: 1,
  page: 1,
};

function panel(board: RequestBoard, mayDecide: boolean) {
  return renderToStaticMarkup(
    <RequestPanel
      board={board}
      params={START_PARAMS}
      mayDecide={mayDecide}
      cards={<RequestCards cards={board.cards} mayDecide={mayDecide} />}
    />,
  );
}

describe("a waiting request card", () => {
  const decided = {
    ...CARD,
    status: "approved",
    points: 3,
    decidedBy: "Lina Contoh",
    decidedAs: "assessor",
    decidedAt: new Date("2026-10-14T03:00:00Z"),
  } as const;

  it("offers Poin from 1 to 30, 2 at the start, Catatan penilai, Setujui and Tolak to an account that may decide", () => {
    const html = panel(BOARD, true);

    expect(html).toContain('min="1" max="30" step="1"');
    expect(html).toContain('value="2"');
    expect(html).toContain("Catatan penilai");
    expect(html).toContain("Setujui");
    expect(html).toContain("Tolak");
  });

  it("offers nothing to a role that only reads, nor on a decided card", () => {
    expect(panel(BOARD, false)).not.toContain("Setujui");
    expect(panel(BOARD, false)).not.toContain("Poin");
    const html = panel({ ...BOARD, cards: [decided] }, true);
    expect(html).not.toContain("Setujui");
    expect(html).toContain("Disetujui +3");
  });
});

describe("Pengajuan penambahan SIKU dari mahasiswa", () => {
  it("offers each status with its count, Diajukan chosen at the start, in the address", () => {
    const html = panel(BOARD, false);

    expect(html).toContain("Pengajuan penambahan SIKU dari mahasiswa");
    expect(html).toContain(
      'aria-current="true" href="/penilaian/siku">Diajukan 1</a>',
    );
    expect(html).toContain('href="/penilaian/siku?pengajuan=disetujui"');
    expect(html).toMatch(/Disetujui (<!-- -->)?4/);
    expect(html).toMatch(/Ditolak (<!-- -->)?2/);
    expect(html).toMatch(/Semua (<!-- -->)?8/);
  });

  it("shows a card with the student, NIM, program, reason, dates, report and small photos", () => {
    const html = panel(BOARD, false);

    expect(html).toContain("Ayu Contoh");
    expect(html).toContain("9900230001 · D3 Akuntansi");
    expect(html).toContain("Melakukan pembimbingan mahasiswa lain");
    expect(html).toMatch(/Kegiatan (<!-- -->)?12 Okt 2026/);
    expect(html).toMatch(/diajukan (<!-- -->)?13 Okt 2026, 19.00/);
    expect(html).toContain("Membimbing dua mahasiswa lain menyiapkan ujian.");
    expect(html).toContain("?ukuran=kecil");
  });

  it("tells a role that only reads who decides", () => {
    expect(panel(BOARD, false)).toContain(READ_ONLY_REQUESTS);
    expect(panel(BOARD, true)).not.toContain(READ_ONLY_REQUESTS);
    expect(panel(BOARD, true)).toContain(DECIDER_REQUESTS);
  });

  it("says so when the status holds no request", () => {
    const html = panel({ ...BOARD, cards: [], matching: 0 }, false);

    expect(html).toContain(NO_REQUESTS_HERE);
  });

  it("warns on a waiting card when the student has a gain with the same reason on that day", () => {
    const warned = { ...CARD, hasSameGain: true };
    const decided = {
      ...warned,
      status: "rejected",
      decidedBy: "Lina Contoh",
      decidedAs: "assessor",
      decidedAt: new Date("2026-10-14T03:00:00Z"),
      note: "Sudah tercatat.",
    } as const;

    expect(panel({ ...BOARD, cards: [warned] }, true)).toContain(
      SAME_GAIN_WARNING,
    );
    const html = panel({ ...BOARD, cards: [decided] }, true);
    expect(html).not.toContain(SAME_GAIN_WARNING);
    expect(html).toContain(
      "Diperiksa Lina Contoh (Penilai Mahasiswa), 14 Okt 2026, 10.00. Catatan: Sudah tercatat.",
    );
  });
});
