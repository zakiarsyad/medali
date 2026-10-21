import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks } from "@/ui/tab-links";
import { ManualRecordForm } from "./manual-record-form";
import { PhotoCards } from "./photo-cards";
import { draw } from "./test-press";
import { TEST_CARD, TEST_EMPTY_VERIFICATION } from "./test-verification";
import type { Verification } from "./verification";
import type { VerificationCard } from "./verification-card";
import { VerificationNumbersView } from "./verification-numbers-view";
import { VerificationScreen } from "./verification-screen";

vi.mock("./verification-actions", () => ({
  validateAttendanceAction: vi.fn(),
  rejectAttendanceAction: vi.fn(),
  validateTickedAction: vi.fn(),
  searchRecordStudentsAction: vi.fn(),
  readRecordActivitiesAction: vi.fn(),
  recordAttendanceAction: vi.fn(),
}));

const TABS = {
  pagePath: "kegiatan",
  tabs: [
    { path: "verifikasi", title: "Verifikasi presensi" },
    { path: "ppks", title: "Kegiatan PPKS" },
  ],
  open: "verifikasi",
};

function shown(more: Partial<Verification> = {}): string {
  return renderToStaticMarkup(
    <VerificationScreen
      tabs={TABS}
      verification={{ ...TEST_EMPTY_VERIFICATION, ...more }}
    />,
  );
}

function listOf(cards: VerificationCard[], matching = cards.length) {
  return { list: { cards, matching, page: 1 } };
}

describe("VerificationScreen", () => {
  it("shows the four numbers, each with its line below", () => {
    const screen = shown({
      numbers: {
        waiting: 12,
        validToday: 3,
        rejected: 4,
        heldToday: 2,
        openNow: 5,
      },
    });

    for (const [label, amount, note] of [
      ["Menunggu verifikasi", "12", "foto kehadiran"],
      ["Divalidasi hari ini", "3", "presensi"],
      ["Ditolak", "4", "perlu kirim ulang"],
      ["Kegiatan hari ini", "2", "5 sedang dibuka"],
    ]) {
      expect(screen).toMatch(
        new RegExp(
          `<dt[^>]*>${label}</dt><dd[^>]*>${amount}</dd><dd[^>]*>${note}</dd>`,
        ),
      );
    }
  });

  it("offers every activity and the schedules that have a card, and the four statuses, starting at Menunggu verifikasi", () => {
    const screen = shown({
      choices: [{ id: "schedule-1", words: "13 Okt 2026 · Latihan uji" }],
    });

    expect(screen).toContain('<option value="" selected="">Semua kegiatan');
    expect(screen).toContain(
      '<option value="schedule-1">13 Okt 2026 · Latihan uji</option>',
    );
    expect(screen).toContain(
      '<option value="menunggu" selected="">Menunggu verifikasi</option>',
    );
    for (const status of ["Divalidasi", "Ditolak", "Semua"]) {
      expect(screen).toContain(`>${status}</option>`);
    }
  });

  it("says that no photo waits when the list of waiting photos is empty", () => {
    expect(shown()).toContain("Tidak ada swafoto yang menunggu verifikasi.");
  });

  it.each(["valid", "rejected", "all"] as const)(
    "says that nothing matches when the list at the status %s is empty",
    (status) => {
      const screen = shown({ filters: { scheduleId: null, status } });

      expect(screen).toContain("Tidak ada data pada filter ini.");
      expect(screen).not.toContain("Tidak ada swafoto");
    },
  );

  it("shows a card with the photo, the name, NIM, program studi, activity and time sent", () => {
    const screen = shown(listOf([TEST_CARD]));

    expect(screen).toContain("Mahasiswa Uji Kartu");
    expect(screen).toContain("8800000001 · Akuntansi uji");
    expect(screen).toContain("Latihan dasar kepemimpinan uji");
    expect(screen).toContain("Dikirim 13 Okt 2026, 12.00");
    expect(screen).not.toContain("Di luar tanggal kegiatan");
    expect(screen).not.toContain("Tidak lagi menjadi peserta");
  });

  it("marks, under the activity, a photo of a student the schedule is no longer meant for", () => {
    const screen = shown(listOf([{ ...TEST_CARD, isMeant: false }]));

    expect(screen).toMatch(
      /Latihan dasar kepemimpinan uji<\/p><div><span[^>]*>Tidak lagi menjadi peserta<\/span><\/div><p[^>]*>Dikirim/,
    );
  });

  it("asks for the photo from the server only as the card scrolls into view", () => {
    const screen = shown(listOf([TEST_CARD]));

    expect(screen).toMatch(
      new RegExp(
        `<img src="/kegiatan/ppks/foto/${TEST_CARD.id}" alt="Foto kehadiran Mahasiswa Uji Kartu"[^>]* loading="lazy"`,
      ),
    );
  });

  it("says so in place of the picture where no file is kept, and asks for none", () => {
    const screen = shown(listOf([{ ...TEST_CARD, hasPhoto: false }]));

    expect(screen).toContain("Foto tidak tersimpan di sini.");
    expect(screen).not.toContain("<img");
  });

  it("marks a photo sent outside the dates of the activity", () => {
    const screen = shown(listOf([{ ...TEST_CARD, isOutsideDates: true }]));

    expect(screen).toContain("Di luar tanggal kegiatan");
  });

  it.each([
    ["valid", "", "Hadir", "Pegawai Uji"],
    [
      "rejected",
      "Wajah tidak terlihat jelas",
      "Ditolak",
      "Wajah tidak terlihat jelas · Pegawai Uji",
    ],
    [
      "dispensation",
      "Sakit. Surat dokter",
      "Dispensasi",
      "Sakit. Surat dokter · Pegawai Uji",
    ],
  ] as const)(
    "shows a card that is %s with its status, its reason and who decided it",
    (status, note, badge, words) => {
      const decided = { ...TEST_CARD, status, note, decidedBy: "Pegawai Uji" };

      const screen = shown(listOf([decided]));

      expect(screen).toMatch(new RegExp(`<span[^>]*>${badge}</span>`));
      expect(screen).toContain(`>${words}</span>`);
    },
  );

  it("shows which of the cards the page holds, 24 a page, with the step to the next page", () => {
    const screen = shown({
      ...listOf([TEST_CARD], 30),
      filters: { scheduleId: null, status: "all" },
    });

    expect(screen).toContain("1–24 dari 30 foto");
    expect(screen).toContain(
      'href="/kegiatan/verifikasi?status=semua&amp;hal=2"',
    );
  });
});

describe("the photo cards of the screen", () => {
  /** The parts that keep something themselves, left as they are. */
  const KEPT = [
    AutoSubmitForm,
    ListPager,
    ManualRecordForm,
    PageHead,
    PhotoCards,
    TabLinks,
    VerificationNumbersView,
  ];

  /** The key that tells React whether the cards part is kept or made anew. */
  function cardsKey(more: Partial<Verification>): string | null {
    const verification = { ...TEST_EMPTY_VERIFICATION, ...more };
    const drawn = draw(
      <VerificationScreen tabs={TABS} verification={verification} />,
      KEPT,
    );
    const cards = drawn.find(({ type }) => type === PhotoCards);
    if (!cards) throw new Error("The screen shows no photo cards.");
    return cards.key;
  }

  it("are kept, with their message and their decided cards, when the last page is emptied and the list falls back to the page before", () => {
    const onLastPage = cardsKey({
      askedPage: 2,
      list: { cards: [TEST_CARD], matching: 30, page: 2 },
    });
    const afterItWasEmptied = cardsKey({
      askedPage: 2,
      list: { cards: [TEST_CARD], matching: 24, page: 1 },
    });

    expect(afterItWasEmptied).toBe(onLastPage);
  });

  it("are made anew for another page or another filter", () => {
    const list = { cards: [TEST_CARD], matching: 30, page: 1 };
    const first = cardsKey({ askedPage: 1, list });

    expect(cardsKey({ askedPage: 2, list: { ...list, page: 2 } })).not.toBe(
      first,
    );
    expect(
      cardsKey({
        askedPage: 1,
        list,
        filters: { scheduleId: null, status: "all" },
      }),
    ).not.toBe(first);
  });
});
