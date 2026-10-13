import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AbsentList, ListAttendance } from "./schedule-attendance";
import { type OpenAbsent, scheduleListAddress } from "./schedule-list-address";
import type { ScheduleRow } from "./schedule-row";
import { ScheduleTable } from "./schedule-table";
import {
  TEST_FORM_PARTS,
  TEST_NO_ATTENDANCE,
  TEST_SCHEDULE,
} from "./test-screen-parts";

function addressOf(open: OpenAbsent | null): string {
  return scheduleListAddress(null, 1, open);
}

function shown(
  day: string,
  time: string,
  onChange: ((schedule: ScheduleRow) => void) | null = null,
  attendance: ListAttendance = TEST_NO_ATTENDANCE,
): string {
  return renderToStaticMarkup(
    <ScheduleTable
      schedules={[TEST_SCHEDULE]}
      counts={TEST_FORM_PARTS.counts}
      now={{ day, time }}
      attendance={attendance}
      addressOf={addressOf}
      onChange={onChange}
    />,
  );
}

/** The cell of a row with that title, as a phone names it. */
function cell(table: string, title: string): string | undefined {
  return new RegExp(`<td data-title="${title}">([^<]*)</td>`).exec(table)?.[1];
}

const COUNTS = {
  [TEST_SCHEDULE.id]: {
    targeted: 96,
    present: 60,
    waiting: 12,
    dispensations: 16,
  },
};

const ABSENT: AbsentList = {
  scheduleId: TEST_SCHEDULE.id,
  targeted: 96,
  absent: 8,
  students: [
    { name: "Mahasiswa Uji Absen", nim: "8800000003" },
    { name: "Mahasiswa Uji Ditolak", nim: "8800000004" },
  ],
  page: 1,
};

describe("ScheduleTable", () => {
  it("shows the days, the hours and until when photos may be uploaded", () => {
    const table = shown("2026-10-13", "08:00");

    expect(table).toContain("13 Okt – 14 Okt 2026");
    expect(table).toContain("07:30–11:30");
    expect(table).toContain("Unggah s.d. 21 Okt (1 minggu)");
  });

  it("shows the name, the place, that it is not required, and the indicators", () => {
    const table = shown("2026-10-13", "08:00");

    expect(table).toContain("<b>Latihan dasar kepemimpinan organisasi</b>");
    expect(table).toContain("Aula asrama · tidak wajib · M2, D2");
  });

  it("shows whom it is for, with the students of that semester in its period and the target", () => {
    const table = shown("2026-10-13", "08:00");

    expect(table).toContain("Semester 3 (Penumbuhan)");
    expect(table).toContain("96 peserta · target 110");
  });

  it.each([
    ["2026-10-12", "23:00", "Akan datang"],
    ["2026-10-13", "07:00", "Hari ini, belum dibuka"],
    ["2026-10-13", "07:30", "Unggah foto dibuka"],
    ["2026-10-21", "23:00", "Unggah foto dibuka"],
    ["2026-10-22", "00:00", "Selesai"],
  ])("on %s at %s shows the status %s", (day, time, status) => {
    const table = shown(day, time);
    const others = [
      "Akan datang",
      "Hari ini, belum dibuka",
      "Unggah foto dibuka",
      "Selesai",
    ].filter((each) => each !== status);

    expect(table).toContain(status);
    for (const other of others) expect(table).not.toContain(other);
  });

  it("shows Hadir, Menunggu and Kehadiran, the dispensations left out of the percent", () => {
    const table = shown("2026-10-14", "08:00", null, {
      counts: COUNTS,
      absent: null,
    });

    for (const title of ["Hadir", "Menunggu", "Kehadiran"]) {
      expect(table).toContain(`<th>${title}</th>`);
    }
    expect(cell(table, "Hadir")).toBe("60");
    expect(cell(table, "Menunggu")).toBe("12");
    // 60 of the 80 who are left without the 16 dispensations.
    expect(cell(table, "Kehadiran")).toBe("75%");
  });

  it('shows "-" as Kehadiran and no "Peserta" before the first day', () => {
    const table = shown("2026-10-12", "23:00");

    expect(cell(table, "Hadir")).toBe("0");
    expect(cell(table, "Menunggu")).toBe("0");
    expect(cell(table, "Kehadiran")).toBe("-");
    expect(table).not.toContain("Peserta");
    expect(table).toContain("<td></td>");
  });

  it('offers "Peserta" from the first day on, as a link that opens the students of the schedule', () => {
    const table = shown("2026-10-13", "07:00");

    expect(table).toContain(
      `href="/kegiatan/ppks?peserta=${TEST_SCHEDULE.id}">Peserta</a>`,
    );
    expect(table).not.toContain("tidak hadir atau ditolak");
  });

  it('opens under the schedule how many it is meant for, how many did not attend, and their names with NIM; "Tutup" closes them', () => {
    const table = shown("2026-10-14", "08:00", null, {
      counts: COUNTS,
      absent: ABSENT,
    });

    expect(table).toContain("96 sasaran. 8 tidak hadir atau ditolak.");
    expect(table).toMatch(/Mahasiswa Uji Absen<span[^>]*>NIM 8800000003</);
    expect(table).toMatch(/Mahasiswa Uji Ditolak<span[^>]*>NIM 8800000004</);
    expect(table).toContain('href="/kegiatan/ppks">Tutup</a>');
    expect(table).not.toContain(">Peserta</a>");
    expect(table).not.toContain("Berikutnya");
  });

  it("pages the students who did not attend, 40 a page", () => {
    const table = shown("2026-10-14", "08:00", null, {
      counts: COUNTS,
      absent: { ...ABSENT, absent: 90, page: 2 },
    });
    const opened = `/kegiatan/ppks?peserta=${TEST_SCHEDULE.id}`;

    expect(table).toContain("41–80 dari 90 mahasiswa");
    expect(table).toContain(`href="${opened}">Sebelumnya</a>`);
    expect(table).toContain(`href="${opened}&amp;halPeserta=3">Berikutnya</a>`);
  });

  it("opens no students under a schedule other than the one asked for", () => {
    const table = shown("2026-10-14", "08:00", null, {
      counts: COUNTS,
      absent: { ...ABSENT, scheduleId: "00000000-0000-4000-8000-0000000000ff" },
    });

    expect(table).not.toContain("tidak hadir atau ditolak");
    expect(table).toContain(">Peserta</a>");
  });

  it("shows no Ubah to an account that only reads", () => {
    const table = shown("2026-10-13", "08:00");

    expect(table).not.toContain("Ubah");
    expect(table).not.toContain("<button");
  });

  it("shows Ubah on each schedule to an account that may change it", () => {
    const table = shown("2026-10-13", "08:00", () => {});

    expect(table).toContain(">Ubah</button>");
    expect(table).toContain("Tindakan");
  });
});
