import { shownDay } from "@/ui/day";
import type { CallSchedule } from "./warning-ids";

/*
 * How the calls and warning letters of the dorm are said on screen. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const NOT_SCHEDULED = "Belum dijadwalkan";

/** The schedule of a call as a row shows it, such as 16 Okt 2026 16:00 · Kantor Pengelola Asrama. */
export function scheduleWords(schedule: CallSchedule | null): string {
  if (schedule === null) return NOT_SCHEDULED;
  return `${shownDay(schedule.day)} ${schedule.time} · ${schedule.place}`;
}

/** Why a resident is called, as one line: the causes joined by "dan". */
export function causeWords(causes: string[]): string {
  return causes.join(" dan ");
}
