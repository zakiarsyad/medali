import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";

/*
 * The times of a leave, which the form writes in campus time as
 * year-month-day, a T, then hour and minute: 2026-10-14T19:30. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

const CAMPUS_TIME = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d$/;
const HOUR_MS = 60 * 60 * 1000;

/** A time on campus as a moment, or null for anything else. */
export function momentOf(sent: string): Date | null {
  const match = CAMPUS_TIME.exec(sent);
  if (!match) return null;
  const at = new Date(`${sent}:00+07:00`);
  if (Number.isNaN(at.getTime())) return null;
  // A day that does not exist, such as 30 February, rolls into the next month.
  if (campusDay(at) !== match[1]) return null;
  return at;
}

/** A moment as a time on campus, such as 2026-10-14T19:30. */
export function campusTimeOf(at: Date): string {
  return `${campusDay(at)}T${campusTime(at)}`;
}

/** How many hours lie between two moments. */
export function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / HOUR_MS;
}

/** Whether a leave ends on another day on campus than the one it starts. */
export function isOvernight(start: Date, end: Date): boolean {
  return campusDay(start) !== campusDay(end);
}

/** A length in hours as the screens say it, such as 7 jam or 1,5 jam. */
export function hoursWords(hours: number): string {
  const shown = hours.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  return `${shown} jam`;
}
