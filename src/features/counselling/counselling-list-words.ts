import { shownDay } from "@/ui/day";
import type { ListSchedule } from "./counselling-list-view";
import { SCHEDULE_STATUS_WORDS, timeWords } from "./schedule-words";

/*
 * The words of "Daftar mahasiswa" on Konseling, as the prototype has
 * them. Read by the screen parts in the browser.
 */

export const NO_COUNSELLING_DATA = "Belum ada data konseling.";

export const NOBODY_ON_FILTER = "Tidak ada mahasiswa pada filter ini.";

/** What a column says when there is nothing in it. */
export const NOTHING = "-";

/**
 * "Sesi berikutnya" of the latest session while it is today or later on
 * campus, as the student's own page counts it; none once it has passed.
 */
export function comingDay(
  nextDay: string | null,
  today: string,
): string | null {
  if (nextDay === null) return null;
  return nextDay >= today ? nextDay : null;
}

/** "Konseling": how many sessions, and the next one when it is set. */
export function sessionsWords(count: number, nextDay: string | null): string {
  if (count === 0) return NOTHING;
  if (nextDay === null) return `${count} sesi`;
  return `${count} sesi, berikutnya ${shownDay(nextDay)}`;
}

/** "Jadwal": the active schedule's status, and its time once set. */
export function scheduleWords(schedule: ListSchedule | null): string {
  if (schedule === null) return NOTHING;
  const status = SCHEDULE_STATUS_WORDS[schedule.status];
  if (schedule.day === null || schedule.hour === null) return status;
  return `${status}, ${timeWords(schedule.day, schedule.hour)}`;
}
