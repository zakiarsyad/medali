import { type UploadRange, uploadDeadline } from "./upload-range";

/** Where a schedule stands on a day at an hour. */
export type ScheduleStatus = "coming" | "not_open_yet" | "open" | "over";

export const STATUS_WORDS: Record<ScheduleStatus, string> = {
  coming: "Akan datang",
  not_open_yet: "Hari ini, belum dibuka",
  open: "Unggah foto dibuka",
  over: "Selesai",
};

/** The parts of a schedule its status is told from. */
export interface StatusParts extends UploadRange {
  startsOn: string;
  /** The hour and minute it starts, such as 07:30. */
  startTime: string;
}

/** A moment on campus: the day, and the hour and minute, such as 07:30. */
export interface CampusMoment {
  day: string;
  time: string;
}

/**
 * The status of a schedule at a moment on campus. Before its first day it
 * is still to come. On its first day it waits until its first hour. From
 * then on photos may be uploaded, up to the end of the last upload day,
 * and after that day it is over.
 */
export function scheduleStatus(
  schedule: StatusParts,
  now: CampusMoment,
): ScheduleStatus {
  if (schedule.startsOn > now.day) return "coming";
  const isFirstDay = schedule.startsOn === now.day;
  if (isFirstDay && now.time < schedule.startTime) return "not_open_yet";
  if (now.day > uploadDeadline(schedule)) return "over";
  return "open";
}
