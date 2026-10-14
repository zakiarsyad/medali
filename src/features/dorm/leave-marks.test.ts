import { describe, expect, it } from "vitest";
import {
  type ApprovedLeave,
  itmkNote,
  leaveMarkOf,
  leaveMarksAt,
} from "./leave-marks";

/** A time on campus, such as 2026-10-14T19:30, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

const EVENING = { day: "2026-10-14", startTime: "19:30", endTime: "21:00" };

const LEAVES: ApprovedLeave[] = [
  {
    studentId: "ani",
    kind: "outing",
    start: on("2026-10-14T13:00"),
    end: on("2026-10-14T20:00"),
  },
  {
    studentId: "bea",
    kind: "skip_activities",
    start: on("2026-10-14T19:00"),
    end: on("2026-10-14T21:30"),
  },
  {
    studentId: "cici",
    kind: "special",
    start: on("2026-10-13T15:00"),
    end: on("2026-10-14T19:30"),
  },
];

describe("leaveMarkOf", () => {
  it("makes Izin pesiar and Izin khusus Izin, and ITMK Hadir with ITMK", () => {
    expect(leaveMarkOf(LEAVES, "ani", EVENING)).toBe("leave");
    expect(leaveMarkOf(LEAVES, "bea", EVENING)).toBe("itmk");
  });

  it("marks nothing for a leave that ends as the activity starts, nor for another student", () => {
    expect(leaveMarkOf(LEAVES, "cici", EVENING)).toBeNull();
    expect(leaveMarkOf(LEAVES, "dodi", EVENING)).toBeNull();
  });
});

describe("leaveMarksAt", () => {
  it("gives the marks of only those students who have one", () => {
    expect(leaveMarksAt(LEAVES, ["ani", "bea", "cici"], EVENING)).toEqual({
      ani: "leave",
      bea: "itmk",
    });
  });
});

describe("itmkNote", () => {
  it("writes ITMK before what BAM noted", () => {
    expect(itmkNote("")).toBe("ITMK");
    expect(itmkNote("Terlambat")).toBe("ITMK · Terlambat");
  });
});
