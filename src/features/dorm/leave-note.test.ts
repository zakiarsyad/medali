import { describe, expect, it } from "vitest";
import { leaveNote } from "./leave-note";

/** A time on campus, such as 2026-10-14T19:30, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

const NOW = on("2026-10-14T10:00");
const COVERED = {
  activityId: "a",
  day: "2026-10-15",
  name: "Belajar malam bersama",
  startTime: "19:30",
  endTime: "21:00",
};

describe("leaveNote", () => {
  it("says the length of fitting times, and nothing is wrong", () => {
    const times = {
      kind: "outing" as const,
      start: on("2026-10-15T09:00"),
      end: on("2026-10-15T16:00"),
    };

    expect(leaveNote(times, NOW, null, false)).toEqual({
      words: "Durasi 7 jam.",
      isProblem: false,
    });
  });

  it("names the activities an ITMK covers, or says there are none", () => {
    const times = {
      kind: "skip_activities" as const,
      start: on("2026-10-15T19:00"),
      end: on("2026-10-15T21:30"),
    };

    expect(leaveNote(times, NOW, [COVERED], false).words).toBe(
      "Durasi 2,5 jam. Kegiatan asrama yang tidak diikuti dan akan tercatat hadir (ITMK): Belajar malam bersama 15 Okt 2026 19:30.",
    );
    expect(leaveNote(times, NOW, [], false).words).toBe(
      "Durasi 2,5 jam. Tidak ada kegiatan asrama Anda dalam rentang ini.",
    );
  });

  it("adds what would refuse the times, an overlap among them", () => {
    const times = {
      kind: "outing" as const,
      start: on("2026-10-15T09:00"),
      end: on("2026-10-15T22:00"),
    };

    expect(leaveNote(times, NOW, null, true)).toEqual({
      words:
        "Durasi 13 jam. Izin pesiar harus kurang dari 12 jam dan tidak bermalam. Gunakan izin khusus. Waktu izin bertabrakan dengan izin lain yang masih diajukan atau disetujui.",
      isProblem: true,
    });
  });
});
