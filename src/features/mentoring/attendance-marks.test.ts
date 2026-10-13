import { describe, expect, it } from "vitest";
import { ATTENDANCE_MARKS } from "@/mentoring/meeting-ids";
import {
  countMarks,
  countWords,
  isAttendanceMark,
  MARK_TITLES,
} from "./attendance-marks";

describe("the marks of a meeting", () => {
  it("are Hadir, Izin, Sakit and Alpa, in that order", () => {
    expect(ATTENDANCE_MARKS.map((mark) => MARK_TITLES[mark])).toEqual([
      "Hadir",
      "Izin",
      "Sakit",
      "Alpa",
    ]);
  });

  it.each(ATTENDANCE_MARKS)("takes %s as a mark", (mark) => {
    expect(isAttendanceMark(mark)).toBe(true);
  });

  it.each(["", "Hadir", "late", "PRESENT"])("takes %o as no mark", (sent) => {
    expect(isAttendanceMark(sent)).toBe(false);
  });
});

describe("countMarks", () => {
  it("counts how many members have each mark", () => {
    const counts = countMarks(["present", "sick", "present", "absent"]);

    expect(counts).toEqual({ present: 2, excused: 0, sick: 1, absent: 1 });
  });

  it("counts nothing for a list without members", () => {
    expect(countMarks([])).toEqual({
      present: 0,
      excused: 0,
      sick: 0,
      absent: 0,
    });
  });
});

describe("countWords", () => {
  it("writes the four counts in one line, as a card shows them", () => {
    const counts = { present: 9, excused: 0, sick: 1, absent: 2 };

    expect(countWords(counts, " · ")).toBe(
      "Hadir 9 · izin 0 · sakit 1 · alpa 2",
    );
    expect(countWords(counts, ", ")).toBe("Hadir 9, izin 0, sakit 1, alpa 2");
  });
});
