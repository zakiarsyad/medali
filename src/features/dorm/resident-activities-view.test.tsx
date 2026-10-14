import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ResidentActivities } from "./resident-activities";
import { ResidentActivitiesView } from "./resident-activities-view";
import type { OwnAttendance } from "./resident-attendance";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

const NOW = { day: "2026-10-14", time: "18:00" };

function view(
  activities: Partial<ResidentActivities>,
  attendance: OwnAttendance | null = null,
): string {
  return renderToStaticMarkup(
    <ResidentActivitiesView
      activities={{
        dorm: "dana_rakca",
        now: NOW,
        today: [],
        coming: [],
        ...activities,
      }}
      attendance={attendance}
    />,
  );
}

const ATTENDANCE: OwnAttendance = {
  present: 11,
  absent: 1,
  history: [
    {
      activityId: "a",
      day: "2026-10-14",
      name: "Apel pagi uji",
      startTime: "05:30",
      status: "absent",
      note: "Sakit",
    },
    {
      activityId: "b",
      day: "2026-10-13",
      name: "Belajar malam uji",
      startTime: "19:30",
      status: "not_announced",
      note: "",
    },
    {
      activityId: "a",
      day: "2026-10-13",
      name: "Apel pagi uji",
      startTime: "05:30",
      status: "present",
      note: "",
    },
  ],
};

describe("the attendance of a resident", () => {
  it("shows how it is counted and the numbers: Kehadiran kegiatan asrama, Tercatat tidak hadir and Kegiatan hari ini", () => {
    const shown = view({ today: [TEST_ROW] }, ATTENDANCE);

    expect(shown).toContain("dihitung langsung di tempat kegiatan");
    expect(shown).toContain("Kehadiran kegiatan asrama</dt><dd");
    expect(shown).toContain(">92%</dd>");
    expect(shown).toContain("11 hadir dari 12 kegiatan yang diumumkan");
    expect(shown).toContain("Tercatat tidak hadir</dt>");
    expect(shown).toContain("Kegiatan hari ini</dt>");
    expect(shown).toContain("Asrama Dana Rakca");
  });

  it("shows 0% before anything was announced", () => {
    const shown = view({}, { present: 0, absent: 0, history: [] });

    expect(shown).toContain(">0%</dd>");
    expect(shown).toContain("Belum ada riwayat.");
  });

  it("shows Riwayat with the date, the activity, the status and the catatan", () => {
    const shown = view({}, ATTENDANCE);

    expect(shown).toContain("Riwayat</h2>");
    expect(shown).toContain('data-title="Tanggal">14 Okt 2026');
    expect(shown).toContain("Tidak hadir</span>");
    expect(shown).toContain('data-title="Catatan">Sakit</td>');
    expect(shown).toContain("Belum diumumkan</span>");
    expect(shown).toContain("Hadir</span>");
    expect(shown).toContain('data-title="Catatan">-</td>');
  });

  it("is not shown without the right to see it", () => {
    const shown = view({ today: [TEST_ROW] });

    expect(shown).not.toContain("Kehadiran kegiatan asrama");
    expect(shown).not.toContain("Riwayat");
  });
});

describe("Kegiatan asrama for a resident", () => {
  it("shows Hari ini as cards with the time, the place, the state, the penanggung jawab and the rincian", () => {
    const shown = view({ today: [TEST_ROW, TEST_ONE_OFF] });

    expect(shown).toContain("Hari ini</h2>");
    expect(shown.match(/<h3/g)).toHaveLength(2);
    expect(shown).toContain("05:30–06:15 · Lapangan uji");
    expect(shown).toContain("Selesai</span>");
    expect(shown).toContain("Hari ini, belum dimulai</span>");
    expect(shown).toContain("Penanggung jawab: ");
    expect(shown).toContain("Pelatih</span>");
    expect(shown).toContain("Tim Pelatih Uji");
    expect(shown).toContain("<b>05:30</b><span>Apel uji</span>");
  });

  it("shows Akan datang with the day, the name, the penanggung jawab, the time and the place of each", () => {
    const coming = [
      { day: "2026-10-15", activity: TEST_ROW },
      { day: "2026-10-16", activity: TEST_ROW },
    ];
    const shown = view({ coming });

    expect(shown).toContain("Akan datang</h2>");
    expect(shown).toContain("15 Okt 2026");
    expect(shown).toContain("16 Okt 2026");
    expect(shown.match(/<b>Apel pagi uji<\/b>/g)).toHaveLength(2);
  });

  it("says so when there is nothing today or to come", () => {
    const shown = view({});

    expect(shown).toContain("Tidak ada kegiatan hari ini.");
    expect(shown).toContain("Belum ada jadwal.");
  });

  it("offers nothing to change", () => {
    const shown = view({ today: [TEST_ROW] });

    expect(shown).not.toContain("<button");
    expect(shown).not.toContain("<form");
  });
});
