/** Sweden writes a day as year-month-day, the way the database keeps it. */
const YEAR_MONTH_DAY = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Jakarta",
});

/** The day it is on campus at a moment, such as 2026-10-12. */
export function campusDay(at: Date = new Date()): string {
  return YEAR_MONTH_DAY.format(at);
}
