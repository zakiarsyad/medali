import { describe, expect, it } from "vitest";
import {
  type ActivityLine,
  attendanceOfLine,
  firstDayShown,
  linesOf,
  overallAttendance,
} from "./dashboard-lines";
import type { Changed, MarkGroup } from "./dashboard-tally";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

// 14 October 2026 at 10:00 on campus.
const NOW = { day: "2026-10-14", time: "10:00" };
const EVENING = { ...TEST_ROW, id: "evening", name: "Apel malam uji" };
const EVENING_ROW = {
  ...EVENING,
  startTime: "21:00",
  endTime: "21:30",
  organiser: "bam" as const,
};

describe("firstDayShown", () => {
  it("is 7 dates before today", () => {
    expect(firstDayShown("2026-10-14")).toBe("2026-10-07");
    expect(firstDayShown("2026-03-03")).toBe("2026-02-24");
  });
});

describe("linesOf", () => {
  it("lists every activity of today and the 7 dates before, the latest first", () => {
    const lines = linesOf([TEST_ROW, EVENING_ROW], [], NOW);

    expect(lines).toHaveLength(16);
    expect(lines[0]).toMatchObject({
      day: "2026-10-14",
      activity: EVENING_ROW,
    });
    expect(lines[1]).toMatchObject({ day: "2026-10-14", activity: TEST_ROW });
    expect(lines.at(-1)).toMatchObject({
      day: "2026-10-07",
      activity: TEST_ROW,
    });
  });

  it("leaves out an activity that does not take place in that time", () => {
    const later = { ...TEST_ONE_OFF, startsOn: "2026-10-20" };

    expect(linesOf([TEST_ONE_OFF, later], [], NOW)).toEqual([
      expect.objectContaining({ day: "2026-10-14", activity: TEST_ONE_OFF }),
    ]);
  });

  it("tells each its state now, and the announced count of its day", () => {
    const counts = [
      { id: "count-1", activityId: TEST_ROW.id, day: "2026-10-14" },
      { id: "count-0", activityId: TEST_ROW.id, day: "2026-10-01" },
    ];
    const [evening, morning, yesterdayEvening] = linesOf(
      [TEST_ROW, EVENING_ROW],
      counts,
      NOW,
    );

    expect(evening).toMatchObject({
      state: "today_not_started",
      countId: null,
    });
    expect(morning).toMatchObject({ state: "over", countId: "count-1" });
    expect(yesterdayEvening).toMatchObject({ state: "over", countId: null });
  });
});

const GROUPS: MarkGroup[] = [
  { countId: "c1", dorm: "dana_rakca", isAbsent: false, students: 9 },
  { countId: "c1", dorm: "dana_rakca", isAbsent: true, students: 1 },
  { countId: "c2", dorm: "cipta_bakti", isAbsent: false, students: 3 },
  { countId: "c2", dorm: "cipta_bakti", isAbsent: true, students: 3 },
  { countId: "c3", dorm: "dana_rakca", isAbsent: true, students: 4 },
];

function line(more: Partial<ActivityLine>): ActivityLine {
  return {
    day: "2026-10-13",
    activity: TEST_ROW,
    state: "over",
    countId: null,
    ...more,
  };
}

const LINES: ActivityLine[] = [
  line({ countId: "c3", state: "running", day: "2026-10-14" }),
  line({ countId: "c1" }),
  line({ countId: "c2", activity: EVENING_ROW }),
  line({}),
];

describe("attendanceOfLine", () => {
  it("is the announced count's Hadir, Tidak hadir and Izin, or null before it is announced", () => {
    const changed: Changed[] = [
      { countId: "c1", dorm: "dana_rakca", isAbsent: true, becomes: "leave" },
    ];

    expect(attendanceOfLine(LINES[1] as ActivityLine, GROUPS, changed)).toEqual(
      { present: 9, absent: 0, leave: 1 },
    );
    expect(attendanceOfLine(LINES[3] as ActivityLine, GROUPS, [])).toBeNull();
  });
});

describe("overallAttendance", () => {
  it("adds up only the announced activities that are over, and says how many", () => {
    expect(overallAttendance(LINES, GROUPS, [])).toEqual({
      attendance: { present: 12, absent: 4, leave: 0 },
      activities: 2,
    });
  });

  it("counts no activity when none is announced and over", () => {
    expect(overallAttendance([line({})], GROUPS, [])).toEqual({
      attendance: { present: 0, absent: 0, leave: 0 },
      activities: 0,
    });
  });
});
