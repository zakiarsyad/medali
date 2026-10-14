import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ActivitiesParams } from "./activities-address";
import type { ActivitiesView } from "./activities-view";
import { ActivityBoard } from "./activity-board";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const NOW = { day: "2026-10-14", time: "18:00" };
const RESIDENTS = {
  wismantara_putra: 3,
  wismantara_putri: 5,
  dana_rakca: 40,
  cipta_bakti: 20,
};

function params(view: ActivitiesParams["view"]): ActivitiesParams {
  return { view, day: NOW.day, page: 1 };
}

function board(view: ActivitiesView): string {
  return renderToStaticMarkup(
    <ActivityBoard params={params(view.view)} view={view} now={NOW} />,
  );
}

const DAILY: ActivitiesView = {
  view: "harian",
  day: NOW.day,
  activities: [TEST_ROW, { ...TEST_ONE_OFF, audience: "women" }],
  residents: RESIDENTS,
};

describe("Jadwal harian", () => {
  it("shows the day, the steps around it, and each activity with its time, kind, penanggung jawab, peserta and state", () => {
    const shown = board(DAILY);

    expect(shown).toContain("Rabu, 14 Okt 2026");
    expect(shown).toContain('aria-label="Hari sebelumnya"');
    expect(shown).toContain('href="/asrama/kegiatan?tgl=2026-10-13"');
    expect(shown).toContain('href="/asrama/kegiatan?tgl=2026-10-15"');
    expect(shown).toContain("05:30–06:15");
    expect(shown).toContain("Rutin</span>");
    expect(shown).toContain("Non rutin</span>");
    expect(shown).toContain("Setiap hari · Apel · Lapangan uji");
    expect(shown).toContain("Pelatih</span>");
    expect(shown).toContain("Semua penghuni (68)");
    expect(shown).toContain("Penghuni putri (45)");
    expect(shown).toContain("Selesai</span>");
    expect(shown).toContain("Hari ini, belum dimulai</span>");
  });

  it("offers Rincian on each activity, its details still closed", () => {
    const shown = board(DAILY);

    expect(shown.match(/>Rincian<\/button>/g)).toHaveLength(2);
    expect(shown).not.toContain("Penanggung jawab</dt>");
  });

  it("says so when the day has no activity", () => {
    const shown = board({ ...DAILY, activities: [] });

    expect(shown).toContain("Tidak ada kegiatan pada tanggal ini.");
    expect(shown).not.toContain("<table");
  });

  it("marks the list that is open in the switch", () => {
    const shown = board(DAILY);

    expect(shown).toContain(
      'aria-current="true" href="/asrama/kegiatan">Jadwal harian</a>',
    );
    expect(shown).toContain(
      'href="/asrama/kegiatan?lihat=rutin">Kegiatan rutin</a>',
    );
    expect(shown.match(/aria-current="true"/g)).toHaveLength(1);
  });
});

describe("Kegiatan rutin", () => {
  it("shows each repeating activity with its Pola, Waktu, Berlaku and Hari tanpa kegiatan", () => {
    const weekly = {
      ...TEST_ROW,
      pattern: "weekly" as const,
      weekdays: [3, 6],
      endsOn: "2026-12-31",
      daysOff: ["2026-10-21"],
    };
    const shown = board({ view: "rutin", routines: [TEST_ROW, weekly] });

    expect(shown).toContain("Harian</span>");
    expect(shown).toContain("Setiap hari");
    expect(shown).toContain("Mingguan</span>");
    expect(shown).toContain("Setiap Rabu, Sabtu");
    expect(shown).toContain("1 Agu 2026 – seterusnya");
    expect(shown).toContain("1 Agu 2026 – 31 Des 2026");
    expect(shown).toContain("21 Okt 2026");
  });

  it("says so when there is none", () => {
    expect(board({ view: "rutin", routines: [] })).toContain(
      "Belum ada kegiatan rutin.",
    );
  });
});

describe("Kegiatan non rutin", () => {
  const list = { activities: [TEST_ONE_OFF], matching: 30, page: 2 };

  it("shows each one-off activity with its Tanggal and Status, and the page shown", () => {
    const shown = board({ view: "nonrutin", list });

    expect(shown).toContain("14 Okt 2026");
    expect(shown).toContain("Hari ini, belum dimulai</span>");
    expect(shown).toContain("26–30 dari 30 kegiatan");
    expect(shown).toContain('href="/asrama/kegiatan?lihat=nonrutin"');
  });

  it("says so when there is none", () => {
    const none = { activities: [], matching: 0, page: 1 };

    expect(board({ view: "nonrutin", list: none })).toContain(
      "Belum ada kegiatan non rutin.",
    );
  });
});

describe("the board for an account that only reads", () => {
  it.each([
    DAILY,
    { view: "rutin", routines: [TEST_ROW] },
    {
      view: "nonrutin",
      list: { activities: [TEST_ONE_OFF], matching: 1, page: 1 },
    },
  ] satisfies ActivitiesView[])(
    "offers no way to add, change or remove an activity in $view",
    (view) => {
      const shown = board(view);

      expect(shown).not.toContain("Tambah kegiatan");
      expect(shown).not.toContain("Ubah");
      expect(shown).not.toContain("Tiada kegiatan");
      expect(shown).not.toContain("Hapus");
      expect(shown).not.toContain("<form");
    },
  );
});
