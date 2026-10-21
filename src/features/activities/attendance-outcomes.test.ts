import { describe, expect, it } from "vitest";
import { activityAttendanceStatus } from "@/db/schema";
import { ATTENDANCE_MARKS } from "@/mentoring/meeting-ids";
import {
  markOutcomes,
  type ScheduleOutcome,
  scheduleOutcomes,
} from "./attendance-outcomes";
import type { AttendanceScore, MarkTally } from "./attendance-score";
import type { AttendanceStatus } from "./attendance-status";
import {
  type CountedSchedule,
  groupScore,
  type KeptStatus,
} from "./mean-score";

const PERIOD = { startYear: 2026, term: "odd" } as const;
const TODAY = "2026-10-20";

function schedule(
  id: string,
  endsOn: string,
  more: Partial<CountedSchedule> = {},
): CountedSchedule {
  return {
    id,
    semester: 3,
    isRequired: true,
    startsOn: endsOn,
    endsOn,
    uploadCount: 1,
    uploadUnit: "day",
    ...more,
  };
}

const SCHEDULES = [
  schedule("closed", "2026-10-01"),
  // Its upload time closes after today.
  schedule("open", "2026-10-20", { uploadCount: 3 }),
  schedule("later", "2026-11-02"),
  schedule("other-semester", "2026-10-02", { semester: 5 }),
  schedule("special", "2026-10-03", { semester: null }),
  schedule("special-open", "2026-10-19", { semester: null, uploadCount: 5 }),
];

/** Angkatan 2025 is in semester 3, 2023 in 5, and 2027 is not yet. */
const COHORTS = [2023, 2025, 2027];

interface Student {
  cohortYear: number;
  statuses: Record<string, AttendanceStatus>;
  chosenIn: string[];
  marks: MarkTally;
}

/** What the database does with the outcomes: it only adds them up. */
function addedUp(outcomes: readonly ScheduleOutcome[], student: Student) {
  let attended = 0;
  let counted = 0;
  for (const outcome of outcomes) {
    if (outcome.cohortYear !== student.cohortYear) continue;
    if (outcome.status !== (student.statuses[outcome.scheduleId] ?? null)) {
      continue;
    }
    if (outcome.namedOnly && !student.chosenIn.includes(outcome.scheduleId)) {
      continue;
    }
    attended += outcome.attended;
    counted += outcome.counted;
  }
  const marks = markOutcomes();
  for (const mark of ATTENDANCE_MARKS) {
    attended += student.marks[mark] * marks[mark].attended;
    counted += student.marks[mark] * marks[mark].counted;
  }
  return { attended, counted };
}

function isKept(status: AttendanceStatus): status is KeptStatus {
  return status === "valid" || status === "dispensation";
}

/** The rule as the student's own page and Rerata nilai kehadiran use it. */
function byTheRule(student: Student): AttendanceScore {
  const kept: Record<string, KeptStatus> = {};
  for (const [id, status] of Object.entries(student.statuses)) {
    if (isKept(status)) kept[id] = status;
  }
  return groupScore(
    { ...student, kept, students: 1 },
    SCHEDULES,
    PERIOD,
    TODAY,
  );
}

const STANDINGS = [undefined, ...activityAttendanceStatus.enumValues];

/**
 * The statuses of a student who stands at each schedule one way further
 * along the list than at the one before, starting at `shift`.
 */
function shiftedStatuses(shift: number): Record<string, AttendanceStatus> {
  const statuses: Record<string, AttendanceStatus> = {};
  SCHEDULES.forEach((each, place) => {
    const status = STANDINGS[(shift + place) % STANDINGS.length];
    if (status) statuses[each.id] = status;
  });
  return statuses;
}

/** Students of every cohort, standing every way at every schedule. */
function students(): Student[] {
  const made: Student[] = [];
  for (const cohortYear of COHORTS) {
    for (let shift = 0; shift < STANDINGS.length; shift += 1) {
      for (const chosenIn of [["special", "special-open"], []]) {
        made.push({
          cohortYear,
          statuses: shiftedStatuses(shift),
          chosenIn,
          marks: { present: 2, excused: 1, sick: 1, absent: shift },
        });
      }
    }
  }
  return made;
}

describe("scheduleOutcomes and markOutcomes", () => {
  it("add up to the score the rule gives each student", () => {
    const outcomes = scheduleOutcomes(SCHEDULES, COHORTS, PERIOD, TODAY);

    const made = students();
    for (const student of made) {
      expect(addedUp(outcomes, student)).toEqual(byTheRule(student));
    }
    // Some students attended and some were counted, so nothing passes empty.
    expect(made.some((each) => byTheRule(each).attended > 2)).toBe(true);
    expect(made.some((each) => byTheRule(each).counted > 3)).toBe(true);
  });

  it("leaves out what adds nothing", () => {
    const outcomes = scheduleOutcomes(SCHEDULES, COHORTS, PERIOD, TODAY);

    for (const outcome of outcomes) {
      expect(outcome.attended + outcome.counted).toBeGreaterThan(0);
    }
    const ids = new Set(outcomes.map((outcome) => outcome.scheduleId));
    expect(ids.has("later")).toBe(false);
  });

  it("counts Hadir and Alpa of a meeting, and leaves Izin and Sakit out", () => {
    expect(markOutcomes()).toEqual({
      present: { attended: 1, counted: 1 },
      excused: { attended: 0, counted: 0 },
      sick: { attended: 0, counted: 0 },
      absent: { attended: 0, counted: 1 },
    });
  });
});
