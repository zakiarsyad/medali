import { describe, expect, it } from "vitest";
import {
  STATUS_WORDS,
  type StatusParts,
  scheduleStatus,
} from "./schedule-status";

/** Two days, from 07:30, with photos until two days after the last day. */
const SCHEDULE: StatusParts = {
  startsOn: "2026-10-13",
  endsOn: "2026-10-14",
  startTime: "07:30",
  uploadCount: 2,
  uploadUnit: "day",
};

function statusAt(day: string, time: string, schedule = SCHEDULE): string {
  return scheduleStatus(schedule, { day, time });
}

describe("scheduleStatus", () => {
  it("is still to come before the first day, whatever the hour", () => {
    expect(statusAt("2026-10-12", "23:59")).toBe("coming");
    expect(statusAt("2026-10-12", "08:00")).toBe("coming");
    expect(statusAt("2025-12-31", "08:00")).toBe("coming");
  });

  it("waits on the first day until the first hour", () => {
    expect(statusAt("2026-10-13", "00:00")).toBe("not_open_yet");
    expect(statusAt("2026-10-13", "07:29")).toBe("not_open_yet");
  });

  it("opens the upload at the first hour of the first day", () => {
    expect(statusAt("2026-10-13", "07:30")).toBe("open");
    expect(statusAt("2026-10-13", "23:59")).toBe("open");
  });

  it("keeps the upload open on a later day, also before the first hour", () => {
    expect(statusAt("2026-10-14", "00:00")).toBe("open");
    expect(statusAt("2026-10-15", "06:00")).toBe("open");
  });

  it("keeps the upload open to the end of the last upload day", () => {
    expect(statusAt("2026-10-16", "23:59")).toBe("open");
  });

  it("is over from the day after the last upload day", () => {
    expect(statusAt("2026-10-17", "00:00")).toBe("over");
    expect(statusAt("2027-01-01", "12:00")).toBe("over");
  });

  it("counts the upload range in weeks when it is given in weeks", () => {
    const inWeeks: StatusParts = { ...SCHEDULE, uploadUnit: "week" };

    expect(statusAt("2026-10-28", "23:59", inWeeks)).toBe("open");
    expect(statusAt("2026-10-29", "00:00", inWeeks)).toBe("over");
  });

  it("closes a schedule of one day with no upload range when that day ends", () => {
    const oneDay: StatusParts = {
      ...SCHEDULE,
      endsOn: SCHEDULE.startsOn,
      uploadCount: 0,
    };

    expect(statusAt("2026-10-13", "07:00", oneDay)).toBe("not_open_yet");
    expect(statusAt("2026-10-13", "08:00", oneDay)).toBe("open");
    expect(statusAt("2026-10-14", "00:00", oneDay)).toBe("over");
  });
});

describe("STATUS_WORDS", () => {
  it("names each status as the screen shows it", () => {
    expect(STATUS_WORDS).toEqual({
      coming: "Akan datang",
      not_open_yet: "Hari ini, belum dibuka",
      open: "Unggah foto dibuka",
      over: "Selesai",
    });
  });
});
