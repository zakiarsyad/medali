import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ScheduleRow } from "./schedule-row";
import { ScheduleTable } from "./schedule-table";
import { TEST_FORM_PARTS, TEST_SCHEDULE } from "./test-screen-parts";

function shown(
  day: string,
  time: string,
  onChange: ((schedule: ScheduleRow) => void) | null = null,
): string {
  return renderToStaticMarkup(
    <ScheduleTable
      schedules={[TEST_SCHEDULE]}
      counts={TEST_FORM_PARTS.counts}
      now={{ day, time }}
      onChange={onChange}
    />,
  );
}

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

  it("shows no attendance numbers", () => {
    const table = shown("2026-10-13", "08:00");

    expect(table).not.toContain("Hadir");
    expect(table).not.toContain("Menunggu");
  });

  it("shows no Ubah to an account that only reads", () => {
    const table = shown("2026-10-13", "08:00");

    expect(table).not.toContain("Ubah");
    expect(table).not.toContain("Tindakan");
    expect(table).not.toContain("<button");
  });

  it("shows Ubah on each schedule to an account that may change it", () => {
    const table = shown("2026-10-13", "08:00", () => {});

    expect(table).toContain(">Ubah</button>");
    expect(table).toContain("Tindakan");
  });
});
