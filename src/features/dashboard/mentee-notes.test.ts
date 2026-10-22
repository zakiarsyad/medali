import { describe, expect, it } from "vitest";
import type { MenteeFacts } from "./mentee-attention";
import {
  attendanceAverageOf,
  attendanceWords,
  MENTEE_NOTES_SHOWN,
  openCoachingOf,
} from "./mentee-notes";

const FACTS: MenteeFacts = {
  studentId: "a",
  name: "Mahasiswa A",
  opensDetail: true,
  rerata: 80,
  coaching: null,
  grade: null,
  attendance: null,
  penalty: null,
  fitness: null,
  mental: null,
};

describe("the numbers under Catatan pengasuhan terbaru", () => {
  it("shows the 5 latest notes", () => {
    expect(MENTEE_NOTES_SHOWN).toBe(5);
  });

  it("counts the anak asuh on the coaching list not yet Selesai", () => {
    expect(
      openCoachingOf([
        FACTS,
        { ...FACTS, coaching: "intensive" },
        { ...FACTS, coaching: "light" },
      ]),
    ).toBe(2);
  });

  it("averages Nilai kehadiran over the anak asuh who have one", () => {
    const average = attendanceAverageOf([
      FACTS,
      { ...FACTS, attendance: 80 },
      { ...FACTS, attendance: 91.5 },
    ]);

    expect(average).toBeCloseTo(85.75);
    expect(attendanceWords(average)).toBe("85,8");
  });

  it("shows a dash when no anak asuh has Nilai kehadiran", () => {
    expect(attendanceAverageOf([FACTS])).toBeNull();
    expect(attendanceWords(null)).toBe("-");
  });
});
