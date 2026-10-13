import { describe, expect, it } from "vitest";
import {
  attendanceScore,
  type ScoredSchedule,
  scoreNote,
  scorePercent,
  shownScore,
} from "./attendance-score";

const TODAY = "2026-10-13";

/** A required schedule of one day whose upload time closed a week ago. */
const CLOSED: ScoredSchedule = {
  endsOn: "2026-10-05",
  uploadCount: 1,
  uploadUnit: "day",
  isRequired: true,
  attendance: null,
};

/** One whose upload time ends today, so it is still open. */
const OPEN: ScoredSchedule = { ...CLOSED, endsOn: "2026-10-12" };

function closed(attendance: ScoredSchedule["attendance"]): ScoredSchedule {
  return { ...CLOSED, attendance };
}

describe("attendanceScore", () => {
  it("counts the valid attendances out of the required schedules whose upload time has closed", () => {
    const schedules = [closed("valid"), closed("valid"), closed(null)];

    expect(attendanceScore(schedules, TODAY)).toEqual({
      attended: 2,
      counted: 3,
    });
  });

  it("counts a closed schedule with nothing sent, a rejected photo or a photo still waiting as not attended", () => {
    const schedules = [closed(null), closed("rejected"), closed("waiting")];

    expect(attendanceScore(schedules, TODAY)).toEqual({
      attended: 0,
      counted: 3,
    });
  });

  it("leaves a dispensation out, on both sides", () => {
    const schedules = [closed("valid"), closed("dispensation")];

    expect(attendanceScore(schedules, TODAY)).toEqual({
      attended: 1,
      counted: 1,
    });
  });

  it("counts a schedule whose upload time is still open only once it is valid", () => {
    const waiting = [
      { ...OPEN, attendance: null },
      { ...OPEN, attendance: "waiting" as const },
      { ...OPEN, attendance: "rejected" as const },
    ];
    const valid = [{ ...OPEN, attendance: "valid" as const }];

    expect(attendanceScore(waiting, TODAY)).toEqual({
      attended: 0,
      counted: 0,
    });
    expect(attendanceScore(valid, TODAY)).toEqual({ attended: 1, counted: 1 });
  });

  it("closes the upload time the day after the last upload day, not on it", () => {
    const lastDay = { ...CLOSED, endsOn: "2026-10-12" };

    expect(attendanceScore([lastDay], "2026-10-13").counted).toBe(0);
    expect(attendanceScore([lastDay], "2026-10-14").counted).toBe(1);
  });

  it("follows an upload range counted in weeks", () => {
    const weeks = { ...CLOSED, endsOn: "2026-10-01", uploadCount: 2 };

    expect(
      attendanceScore([{ ...weeks, uploadUnit: "week" }], TODAY).counted,
    ).toBe(0);
    expect(
      attendanceScore([{ ...weeks, uploadUnit: "day" }], TODAY).counted,
    ).toBe(1);
  });

  it("leaves out a schedule that is not required, attended or not", () => {
    const schedules = [
      { ...closed("valid"), isRequired: false },
      { ...closed(null), isRequired: false },
    ];

    expect(attendanceScore(schedules, TODAY)).toEqual({
      attended: 0,
      counted: 0,
    });
  });

  it("counts nothing when there is no schedule", () => {
    expect(attendanceScore([], TODAY)).toEqual({ attended: 0, counted: 0 });
  });
});

describe("scorePercent", () => {
  it("gives the percentage with one decimal", () => {
    expect(scorePercent({ attended: 1, counted: 3 })).toBe(33.3);
    expect(scorePercent({ attended: 2, counted: 3 })).toBe(66.7);
    expect(scorePercent({ attended: 7, counted: 8 })).toBe(87.5);
  });

  it("gives 0 and 100 at the ends", () => {
    expect(scorePercent({ attended: 0, counted: 4 })).toBe(0);
    expect(scorePercent({ attended: 4, counted: 4 })).toBe(100);
  });

  it("gives nothing while no required schedule counts", () => {
    expect(scorePercent({ attended: 0, counted: 0 })).toBeNull();
  });
});

describe("what the number Nilai kehadiran kegiatan shows", () => {
  it("writes the percentage with one decimal, with a comma", () => {
    expect(shownScore({ attended: 1, counted: 3 })).toBe("33,3%");
    expect(shownScore({ attended: 4, counted: 4 })).toBe("100,0%");
    expect(shownScore({ attended: 0, counted: 2 })).toBe("0,0%");
  });

  it("says how many of how many below it", () => {
    expect(scoreNote({ attended: 1, counted: 3 })).toBe(
      "1/3 kegiatan karakter",
    );
  });

  it('shows "-" and "belum ada kegiatan wajib" with none', () => {
    const none = { attended: 0, counted: 0 };

    expect(shownScore(none)).toBe("-");
    expect(scoreNote(none)).toBe("belum ada kegiatan wajib");
  });
});
