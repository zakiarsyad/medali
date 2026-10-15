import type { LeaveSpan } from "./leave-cover";

const MONTHS_IN_YEAR = 12;

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

/** The campus month a day is in, from its first midnight on campus to the next month's. */
export function monthOf(day: string): LeaveSpan {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const isDecember = month === MONTHS_IN_YEAR;
  const nextYear = isDecember ? year + 1 : year;
  const nextMonth = isDecember ? 1 : month + 1;
  return {
    start: new Date(`${year}-${twoDigits(month)}-01T00:00:00+07:00`),
    end: new Date(`${nextYear}-${twoDigits(nextMonth)}-01T00:00:00+07:00`),
  };
}
