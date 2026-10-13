import { daysAfter } from "@/academic-periods/days-after";
import type { AttendanceStatus } from "@/features/activities/attendance-status";
import { isInSemester } from "@/features/activities/participants";
import { uploadDeadline } from "@/features/activities/upload-range";
import type { SampleActivitySchedule } from "./sample-activity-schedules";
import { SAMPLE_PPKS_ACTIVITIES } from "./sample-data";
import type { SampleStudent } from "./sample-students";

/*
 * Made-up people only. Every attendance here is invented, and none has a
 * photo: the sample data keeps no picture of anyone.
 */

export interface SampleActivityAttendance {
  /** The NIM of the sample student. */
  nim: string;
  schedule: SampleActivitySchedule;
  status: AttendanceStatus;
  note: string;
  /** When the photo was sent. Null for a dispensation, which has none. */
  sentAt: Date | null;
  /** When Pegawai UPK decided. Null while the photo waits. */
  decidedAt: Date | null;
}

type Turn = AttendanceStatus | null;

/**
 * What the students get, in turn, at a schedule whose upload time has
 * closed, and at one that began before today and still takes photos.
 * Null is a student who sent nothing.
 */
const AFTER_CLOSING: Turn[] = [
  "valid",
  "valid",
  "rejected",
  "dispensation",
  null,
  "valid",
];
const WHILE_OPEN: Turn[] = [null, "waiting"];
/**
 * At a schedule whose upload time closed a few days ago, most are absent
 * or rejected, so the sample data has attendance to ask a clarification
 * for.
 */
const WHILE_CLARIFYING: Turn[] = [
  null,
  "rejected",
  null,
  "valid",
  "valid",
  "dispensation",
];

/** How many days after the last upload day a clarification can be sent. */
const DAYS_TO_CLARIFY = 7;

/**
 * Whether a clarification can be sent for a schedule on a day: its upload
 * time has closed, and no more than seven days ago.
 */
export function takesClarifications(
  schedule: SampleActivitySchedule,
  day: string,
): boolean {
  const lastUploadDay = uploadDeadline(schedule);
  return (
    lastUploadDay < day && day <= daysAfter(lastUploadDay, DAYS_TO_CLARIFY)
  );
}

const NOTES: Record<AttendanceStatus, string> = {
  waiting: "",
  valid: "",
  rejected: "Wajah tidak terlihat jelas",
  dispensation: "Sakit",
};

function semesterOf(schedule: SampleActivitySchedule): number | null {
  const activity = SAMPLE_PPKS_ACTIVITIES.find(
    (each) => each.name === schedule.activityName,
  );
  return activity?.semester ?? null;
}

function isMeantFor(
  schedule: SampleActivitySchedule,
  student: SampleStudent,
): boolean {
  const semester = semesterOf(schedule);
  if (semester === null) return false;
  return isInSemester(student.cohortYear, semester, schedule.period);
}

/** The schedules a student takes part in that began before a day, oldest first. */
export function begunFor(
  schedules: SampleActivitySchedule[],
  student: SampleStudent,
  day: string,
): SampleActivitySchedule[] {
  return schedules
    .filter((schedule) => schedule.startsOn < day)
    .filter((schedule) => isMeantFor(schedule, student))
    .sort((one, other) => one.startsOn.localeCompare(other.startsOn));
}

function turnAt(turns: Turn[], place: number): Turn {
  return turns[place % turns.length] ?? null;
}

export function campusMoment(day: string, time: string): Date {
  return new Date(`${day}T${time}:00+07:00`);
}

function attendanceOf(
  nim: string,
  schedule: SampleActivitySchedule,
  status: AttendanceStatus,
): SampleActivityAttendance {
  const sentAt = campusMoment(schedule.startsOn, schedule.endTime);
  // Decided the same evening: before today, so never ahead of the clock.
  const decidedAt = campusMoment(schedule.startsOn, "22:00");
  return {
    nim,
    schedule,
    status,
    note: NOTES[status],
    sentAt: status === "dispensation" ? null : sentAt,
    decidedAt: status === "waiting" ? null : decidedAt,
  };
}

/**
 * The made-up attendance of the Aktif sample students at the sample
 * schedules that began before a day. The students of one angkatan take
 * turns, so the first of them has, schedule after schedule, every status
 * there is, and a schedule they sent nothing for.
 */
export function sampleActivityAttendances(
  schedules: SampleActivitySchedule[],
  students: SampleStudent[],
  day: string,
): SampleActivityAttendance[] {
  const attendances: SampleActivityAttendance[] = [];
  for (const { student, place } of activeByCohortPlace(students)) {
    const begun = begunFor(schedules, student, day);
    const turns = turnsAt(begun, place, day);
    for (const [schedulePlace, schedule] of begun.entries()) {
      const status = turns[schedulePlace] ?? null;
      if (status === null) continue;
      attendances.push(attendanceOf(student.nim, schedule, status));
    }
  }
  return attendances;
}

/**
 * What one student gets at each of the schedules they take part in. The
 * schedules that still take a clarification are counted on their own, so
 * the first student of an angkatan is absent at the first and the third
 * of them and has a rejected photo at the second, however many other
 * schedules lie between.
 */
function turnsAt(
  begun: SampleActivitySchedule[],
  studentPlace: number,
  day: string,
): Turn[] {
  let clarifiable = 0;
  return begun.map((schedule, schedulePlace) => {
    if (takesClarifications(schedule, day)) {
      clarifiable += 1;
      return turnAt(WHILE_CLARIFYING, studentPlace + clarifiable - 1);
    }
    const isClosed = uploadDeadline(schedule) < day;
    const turns = isClosed ? AFTER_CLOSING : WHILE_OPEN;
    return turnAt(turns, studentPlace + schedulePlace);
  });
}

/** An Aktif sample student, with their place among those of their angkatan. */
export interface PlacedStudent {
  student: SampleStudent;
  place: number;
}

export function activeByCohortPlace(
  students: SampleStudent[],
): PlacedStudent[] {
  const placed: PlacedStudent[] = [];
  const placeInCohort = new Map<number, number>();
  for (const student of students) {
    if ((student.status ?? "active") !== "active") continue;
    const place = placeInCohort.get(student.cohortYear) ?? 0;
    placeInCohort.set(student.cohortYear, place + 1);
    placed.push({ student, place });
  }
  return placed;
}
