import {
  LEAVE_MAX_DAYS,
  LEAVE_MAX_DAYS_AHEAD,
  type LeaveKind,
  OUTING_MAX_HOURS,
} from "./leave-ids";
import { hoursBetween, hoursWords, isOvernight } from "./leave-time";

/*
 * The rules of the times of a leave. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

const HOURS_PER_DAY = 24;

/** The times of one leave. */
export interface LeaveTimes {
  kind: LeaveKind;
  start: Date;
  end: Date;
}

function isSkipping(kind: LeaveKind): boolean {
  return kind === "skip_activities";
}

export function endNotAfterStartWords(kind: LeaveKind): string {
  return isSkipping(kind)
    ? "Jam selesai harus setelah jam mulai."
    : "Waktu kembali harus setelah waktu berangkat.";
}

export function startPassedWords(kind: LeaveKind): string {
  return isSkipping(kind)
    ? "Jam mulai sudah lewat."
    : "Waktu berangkat sudah lewat.";
}

export const OUTING_DOES_NOT_FIT =
  "Izin pesiar harus kurang dari 12 jam dan tidak bermalam. Gunakan izin khusus.";

export const TOO_LONG = `Izin paling lama ${LEAVE_MAX_DAYS} hari.`;

export const TOO_FAR_AHEAD =
  "Izin hanya dapat diajukan paling jauh satu tahun ke depan.";

/**
 * Whether the length of a leave fits its kind: Izin pesiar lasts less
 * than 12 hours and ends on the day on campus it starts. ITMK and Izin
 * khusus have no rule on their length but the longest any leave may be.
 */
export function fitsKind(times: LeaveTimes): boolean {
  if (times.kind !== "outing") return true;
  const hours = hoursBetween(times.start, times.end);
  return hours < OUTING_MAX_HOURS && !isOvernight(times.start, times.end);
}

/**
 * What is wrong with the times of a leave asked for at a moment, each in
 * the words the resident sees, or none: the end must be after the start,
 * the start may not have passed nor lie more than a year ahead, Izin
 * pesiar must fit its kind, and no leave may last more than 30 days.
 */
export function timeProblems(times: LeaveTimes, now: Date): string[] {
  const { kind, start, end } = times;
  const problems: string[] = [];
  if (end <= start) problems.push(endNotAfterStartWords(kind));
  if (start < now) problems.push(startPassedWords(kind));
  const daysAhead = hoursBetween(now, start) / HOURS_PER_DAY;
  if (daysAhead > LEAVE_MAX_DAYS_AHEAD) problems.push(TOO_FAR_AHEAD);
  if (end <= start) return problems;
  if (!fitsKind(times)) problems.push(OUTING_DOES_NOT_FIT);
  if (hoursBetween(start, end) > LEAVE_MAX_DAYS * HOURS_PER_DAY) {
    problems.push(TOO_LONG);
  }
  return problems;
}

/** How long a leave lasts, such as "Durasi 26 jam, melewati malam." */
export function lengthWords(start: Date, end: Date): string {
  const length = hoursWords(hoursBetween(start, end));
  if (isOvernight(start, end)) return `Durasi ${length}, melewati malam.`;
  return `Durasi ${length}.`;
}
