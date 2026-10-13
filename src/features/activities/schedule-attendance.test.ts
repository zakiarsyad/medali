import { describe, expect, it } from "vitest";
import {
  absentWords,
  attendancePercent,
  hasStarted,
  shownAttendance,
} from "./schedule-attendance";

function count(targeted: number, present: number, dispensations = 0) {
  return { targeted, present, waiting: 0, dispensations };
}

describe("attendancePercent", () => {
  it("is those present out of the students the schedule is meant for, as a whole percent", () => {
    expect(attendancePercent(count(40, 30))).toBe(75);
    expect(attendancePercent(count(3, 2))).toBe(67);
    expect(attendancePercent(count(40, 0))).toBe(0);
    expect(attendancePercent(count(40, 40))).toBe(100);
  });

  it("leaves the dispensations out of the students counted", () => {
    expect(attendancePercent(count(40, 30, 10))).toBe(100);
    expect(attendancePercent(count(10, 4, 2))).toBe(50);
  });

  it("is nothing when nobody is left to count", () => {
    expect(attendancePercent(count(0, 0))).toBeNull();
    expect(attendancePercent(count(5, 0, 5))).toBeNull();
  });
});

describe("shownAttendance", () => {
  it('shows the percent, and "-" before the start or with nobody to count', () => {
    expect(shownAttendance(count(40, 30))).toBe("75%");
    expect(shownAttendance(undefined)).toBe("-");
    expect(shownAttendance(count(5, 0, 5))).toBe("-");
  });
});

describe("hasStarted", () => {
  it("says a schedule has started from its first day on", () => {
    const schedule = { startsOn: "2026-10-13" };

    expect(hasStarted(schedule, "2026-10-12")).toBe(false);
    expect(hasStarted(schedule, "2026-10-13")).toBe(true);
    expect(hasStarted(schedule, "2026-10-14")).toBe(true);
  });
});

describe("absentWords", () => {
  it("says how many the schedule is meant for and how many did not attend", () => {
    expect(absentWords(1250, 40)).toBe(
      "1.250 sasaran. 40 tidak hadir atau ditolak.",
    );
  });
});
