import { describe, expect, it } from "vitest";
import type { HistoryEntry, TimedMark } from "./history";
import {
  coveredOwnMarks,
  historyWithLeave,
  tallyWithLeave,
} from "./history-leave";
import type { ApprovedLeave } from "./leave-marks";

/** A time on campus, such as 2026-10-14T19:30, as a moment. */
function on(time: string): Date {
  return new Date(`${time}:00+07:00`);
}

const NOW = { day: "2026-10-14", time: "10:00" };

function mark(day: string, isAbsent: boolean, note = ""): TimedMark {
  return {
    activityId: `kegiatan-${day}`,
    day,
    name: "Belajar malam bersama",
    startTime: "19:30",
    endTime: "21:00",
    isAbsent,
    note,
  };
}

const MARKS = [
  mark("2026-10-11", true, "Tidak ada kabar"),
  mark("2026-10-12", true),
  mark("2026-10-13", false),
  mark("2026-10-14", false),
];

const LEAVES: ApprovedLeave[] = [
  {
    studentId: "ani",
    kind: "outing",
    start: on("2026-10-11T13:00"),
    end: on("2026-10-11T20:00"),
  },
  {
    studentId: "ani",
    kind: "skip_activities",
    start: on("2026-10-12T19:00"),
    end: on("2026-10-12T21:30"),
  },
  {
    studentId: "ani",
    kind: "special",
    start: on("2026-10-14T15:00"),
    end: on("2026-10-15T17:00"),
  },
];

describe("coveredOwnMarks", () => {
  it("finds the marks over now that the student's approved leave covers, and none of another student", () => {
    const covered = coveredOwnMarks(MARKS, LEAVES, "ani", NOW);

    // Today's activity is not over yet, so it is left out.
    expect([...covered.entries()]).toEqual([
      ["2026-10-11 kegiatan-2026-10-11", { isAbsent: true, mark: "leave" }],
      ["2026-10-12 kegiatan-2026-10-12", { isAbsent: true, mark: "itmk" }],
    ]);
    expect(coveredOwnMarks(MARKS, LEAVES, "bea", NOW).size).toBe(0);
  });
});

describe("tallyWithLeave", () => {
  it("leaves Izin out of both, and counts ITMK as Hadir", () => {
    const covered = coveredOwnMarks(MARKS, LEAVES, "ani", NOW);

    expect(tallyWithLeave({ present: 1, absent: 2 }, covered)).toEqual({
      present: 2,
      absent: 0,
    });
  });
});

describe("historyWithLeave", () => {
  it("shows Izin, and Hadir with the note ITMK, but leaves an activity not announced as it is", () => {
    const covered = coveredOwnMarks(MARKS, LEAVES, "ani", NOW);
    const entry = (day: string, status: HistoryEntry["status"], note = "") => ({
      activityId: `kegiatan-${day}`,
      day,
      name: "Belajar malam bersama",
      startTime: "19:30",
      status,
      note,
    });

    expect(
      historyWithLeave(
        [
          entry("2026-10-11", "absent", "Tidak ada kabar"),
          entry("2026-10-12", "absent"),
          entry("2026-10-13", "present"),
        ],
        covered,
      ).map((each) => [each.status, each.note]),
    ).toEqual([
      ["leave", "Tidak ada kabar"],
      ["present", "ITMK"],
      ["present", ""],
    ]);
    expect(
      historyWithLeave([entry("2026-10-11", "not_announced")], covered)[0]
        ?.status,
    ).toBe("not_announced");
  });
});
