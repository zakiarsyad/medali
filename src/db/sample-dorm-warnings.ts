import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import {
  ANNOUNCEMENT_TIME,
  type Punishment,
  VIOLATION_REASONS,
} from "@/features/dorm/violation-ids";
import {
  DEFAULT_CALL_PLACE,
  DEFAULT_CALL_TIME,
  SP1_VIOLATIONS,
  SP2_VIOLATIONS,
  type WarningLevel,
} from "@/features/dorm/warning-ids";
import { SAMPLE_VIOLATION_RESIDENTS } from "./sample-dorm-violations";

/*
 * Made-up calls and warning letters only, of made-up residents, with the
 * made-up violations that led to them.
 */

/** Which of the sample residents, by place in their list, has what. */
export const SAMPLE_WARNING_RESIDENTS = {
  /** Called for SP 1, the call scheduled for tomorrow. */
  called: SAMPLE_VIOLATION_RESIDENTS,
  /** Given SP 1, with one violation more since. */
  firstLetter: SAMPLE_VIOLATION_RESIDENTS + 1,
  /** Given SP 1 and SP 2, with the proposal to Kepala Unit. */
  secondLetter: SAMPLE_VIOLATION_RESIDENTS + 2,
} as const;

/** A sample violation that went up to Pengelola Asrama long ago. */
export interface SampleCountedViolation {
  resident: number;
  day: string;
  reason: string;
  punishment: Punishment;
  announcedAt: Date;
}

export interface SampleCall {
  day: string;
  time: string;
  place: string;
  /** When Pengelola Asrama sent it. */
  sentAt: Date;
}

export interface SampleIssue {
  at: Date;
  result: string;
  proposalNote: string;
}

/** A sample call and the SP that followed it, or none yet. */
export interface SampleLetter {
  resident: number;
  level: WarningLevel;
  call: SampleCall;
  issue: SampleIssue | null;
}

export interface SampleWarnings {
  violations: SampleCountedViolation[];
  letters: SampleLetter[];
}

const PUNISHMENTS: Punishment[] = ["warning", "direct_action", "tks"];

/** A moment on campus, as a day and an hour such as 16:00. */
function campusMoment(day: string, time: string): Date {
  return new Date(`${day}T${time}:00+07:00`);
}

/**
 * The day so many days before today, but never before the running
 * period began, so that the violation counts in it.
 */
function dayBack(today: string, back: number, periodStart: string): string {
  const day = daysAfter(today, -back);
  return day < periodStart ? periodStart : day;
}

/** One violation a day, from `firstBack` days before today onwards. */
function violationsOf(
  resident: number,
  amount: number,
  firstBack: number,
  today: string,
  periodStart: string,
): SampleCountedViolation[] {
  const made: SampleCountedViolation[] = [];
  for (let place = 0; place < amount; place++) {
    const day = dayBack(today, firstBack - place, periodStart);
    made.push({
      resident,
      day,
      reason: VIOLATION_REASONS[place % VIOLATION_REASONS.length] ?? "",
      punishment: PUNISHMENTS[place % PUNISHMENTS.length] ?? "warning",
      announcedAt: campusMoment(day, ANNOUNCEMENT_TIME),
    });
  }
  return made;
}

/** A call held so many days before today, and the SP issued after it. */
function heldCall(
  resident: number,
  level: WarningLevel,
  back: number,
  today: string,
  issue: Omit<SampleIssue, "at">,
): SampleLetter {
  const day = daysAfter(today, -back);
  return {
    resident,
    level,
    call: {
      day,
      time: DEFAULT_CALL_TIME,
      place: DEFAULT_CALL_PLACE,
      sentAt: campusMoment(daysAfter(day, -2), "10:00"),
    },
    issue: { ...issue, at: campusMoment(day, "16:30") },
  };
}

/**
 * Three residents past the ones the other sample violations are spread
 * over: one with 7 counted violations, called for tomorrow at 16:00; one
 * with 8, given SP 1 ten days ago; and one with 12, given SP 1 fourteen
 * days ago and SP 2 three days ago, with its proposal to Kepala Unit.
 * Their violations fall on the days of the running period before that.
 */
export function sampleDormWarnings(
  now: Date,
  periodStart: string,
): SampleWarnings {
  const today = campusDay(now);
  const { called, firstLetter, secondLetter } = SAMPLE_WARNING_RESIDENTS;
  const violations = [
    ...violationsOf(called, SP1_VIOLATIONS, 18, today, periodStart),
    ...violationsOf(firstLetter, SP1_VIOLATIONS + 1, 20, today, periodStart),
    ...violationsOf(secondLetter, SP1_VIOLATIONS, 22, today, periodStart),
    ...violationsOf(
      secondLetter,
      SP2_VIOLATIONS - SP1_VIOLATIONS,
      12,
      today,
      periodStart,
    ),
  ];
  const tomorrow = daysAfter(today, 1);
  const letters: SampleLetter[] = [
    {
      resident: called,
      level: 1,
      call: {
        day: tomorrow,
        time: DEFAULT_CALL_TIME,
        place: DEFAULT_CALL_PLACE,
        sentAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
      issue: null,
    },
    heldCall(firstLetter, 1, 10, today, {
      result:
        "Mahasiswa mengakui pelanggaran dan berkomitmen memperbaiki kedisiplinan.",
      proposalNote: "",
    }),
    heldCall(secondLetter, 1, 14, today, {
      result:
        "Mahasiswa hadir, mengakui keterlambatan berulang, dan berjanji tepat waktu.",
      proposalNote: "",
    }),
    heldCall(secondLetter, 2, 3, today, {
      result:
        "Mahasiswa hadir dan mengakui pelanggaran berulang setelah menerima SP 1.",
      proposalNote:
        "Pelanggaran tetap berulang setelah SP 1; diusulkan hukuman disiplin ringan.",
    }),
  ];
  return { violations, letters };
}
