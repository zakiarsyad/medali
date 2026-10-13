import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FormParts } from "./form-values";
import type { ScheduleList } from "./list-schedules";
import { ScheduleBoard } from "./schedule-board";
import { TEST_FORM_PARTS, TEST_SCHEDULE } from "./test-screen-parts";

vi.mock("./actions", () => ({ saveScheduleAction: vi.fn() }));

const ONE: ScheduleList = { schedules: [TEST_SCHEDULE], matching: 1, page: 1 };
const NONE: ScheduleList = { schedules: [], matching: 0, page: 1 };

function board(
  form: FormParts | null,
  list = ONE,
  level: number | null = null,
) {
  return renderToStaticMarkup(
    <ScheduleBoard
      list={list}
      level={level}
      counts={TEST_FORM_PARTS.counts}
      now={{ day: "2026-10-13", time: "08:00" }}
      form={form}
    />,
  );
}

describe("ScheduleBoard for an account that may manage activities", () => {
  it("shows the panel Jadwalkan kegiatan with its line and its button, the form still closed", () => {
    const shown = board(TEST_FORM_PARTS);

    expect(shown).toContain("Jadwalkan kegiatan</h2>");
    expect(shown).toContain(
      "Pilih kegiatan dari daftar Kurikulum, lalu atur rentang tanggal dan jam.",
    );
    expect(shown).toContain("Jadwalkan kegiatan PPKS</button>");
    expect(shown).not.toContain("<form");
  });
});

describe("ScheduleBoard for an account that only reads", () => {
  it("shows the schedules without any way to add one", () => {
    const shown = board(null);

    expect(shown).toContain("Jadwal dan kehadiran");
    expect(shown).toContain("Latihan dasar kepemimpinan organisasi");
    expect(shown).not.toContain("Jadwalkan kegiatan");
    expect(shown).not.toContain("<button");
    expect(shown).not.toContain("<form");
  });
});

describe("the list of the board", () => {
  it("offers Semua and the four tahap, and marks the one that is open", () => {
    const shown = board(null, ONE, 2);

    for (const name of [
      "Semua",
      "Penanaman",
      "Penumbuhan",
      "Pengembangan",
      "Pematangan",
    ]) {
      expect(shown).toContain(`>${name}</a>`);
    }
    expect(shown).toContain(
      'aria-current="true" href="/kegiatan/ppks?tahap=2">Penumbuhan</a>',
    );
    expect(shown.match(/aria-current="true"/g)).toHaveLength(1);
  });

  it("says so when there is no schedule", () => {
    const shown = board(null, NONE);

    expect(shown).toContain("Belum ada jadwal kegiatan.");
    expect(shown).not.toContain("<table");
  });

  it("says which schedules the page shows", () => {
    expect(board(null)).toContain("1–1 dari 1 jadwal");
  });
});
