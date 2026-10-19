import { daysAfter } from "./days-after";

const SATURDAY = 6;
const SUNDAY = 0;

/** The day of the week of a day written as year-month-day: 0 for Minggu. */
function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

/** Whether a day written as year-month-day is Senin to Jumat. */
export function isWeekday(day: string): boolean {
  const weekday = weekdayOf(day);
  return weekday !== SATURDAY && weekday !== SUNDAY;
}

/** The day itself when it is Senin to Jumat, otherwise the Senin after it. */
export function weekdayFrom(day: string): string {
  const weekday = weekdayOf(day);
  if (weekday === SATURDAY) return daysAfter(day, 2);
  if (weekday === SUNDAY) return daysAfter(day, 1);
  return day;
}
