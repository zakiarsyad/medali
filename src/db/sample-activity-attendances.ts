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
function begunFor(
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

function campusMoment(day: string, time: string): Date {
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
  const placeInCohort = new Map<number, number>();
  for (const student of students) {
    if ((student.status ?? "active") !== "active") continue;
    const studentPlace = placeInCohort.get(student.cohortYear) ?? 0;
    placeInCohort.set(student.cohortYear, studentPlace + 1);
    const begun = begunFor(schedules, student, day);
    for (const [schedulePlace, schedule] of begun.entries()) {
      const isClosed = uploadDeadline(schedule) < day;
      const turns = isClosed ? AFTER_CLOSING : WHILE_OPEN;
      const status = turnAt(turns, studentPlace + schedulePlace);
      if (status === null) continue;
      attendances.push(attendanceOf(student.nim, schedule, status));
    }
  }
  return attendances;
}
