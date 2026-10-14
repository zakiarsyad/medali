// Sample NIMs of this file: 9937780000 to 9937780099.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityDetail } from "./activity-detail";
import type { AnnouncedAttendance } from "./announced-attendance";
import { TEST_ROW } from "./test-activities";

// 06:45 on campus on 14 October 2026.
const MORNING = new Date("2026-10-13T23:45:00Z");

const ANNOUNCED: AnnouncedAttendance = {
  announcedAt: MORNING,
  announcedBy: "Rizky Pratama",
  present: 40,
  absent: 2,
  marked: [
    {
      studentId: "ani",
      name: "Ani Wiratama",
      nim: "9937780001",
      isAbsent: true,
      note: "Sakit",
    },
    {
      studentId: "budi",
      name: "Budi Hasibuan",
      nim: "9937780002",
      isAbsent: false,
      note: "Terlambat",
    },
  ],
};

function detail(attendance: AnnouncedAttendance | undefined | null): string {
  return renderToStaticMarkup(
    <ActivityDetail
      activity={TEST_ROW}
      participants={42}
      attendance={attendance}
    />,
  );
}

describe("Rincian of an activity", () => {
  it("shows Pengumuman BAM with when and by whom, the Ringkasan and who was absent or has a note", () => {
    const shown = detail(ANNOUNCED);

    expect(shown).toContain(
      "Sudah diumumkan 14 Okt 2026, 06.45 oleh Rizky Pratama",
    );
    expect(shown).toContain("<dt>Ringkasan</dt><dd>40 hadir · 2 tidak hadir");
    expect(shown).toContain("<b>Ani Wiratama</b>");
    expect(shown).toContain("Tidak hadir</span>");
    expect(shown).toContain("Sakit");
    expect(shown).toContain("<b>Budi Hasibuan</b>");
    expect(shown).toContain("Hadir</span>");
    expect(shown).toContain("Terlambat");
  });

  it("says so when everyone was present without a note", () => {
    expect(detail({ ...ANNOUNCED, marked: [] })).toContain(
      "Semua peserta hadir tanpa catatan.",
    );
  });

  it("shows only Belum diumumkan for an activity without an announcement", () => {
    const shown = detail(undefined);

    expect(shown).toContain("<dt>Pengumuman BAM</dt><dd>Belum diumumkan</dd>");
    expect(shown).not.toContain("Ringkasan");
  });

  it("shows nothing of the attendance to an account that may not see it", () => {
    expect(detail(null)).not.toContain("Pengumuman BAM");
  });
});
