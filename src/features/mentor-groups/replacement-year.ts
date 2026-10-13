/** The days a calendar year holds: from its first day up to, not with, `before`. */
export interface YearDays {
  from: string;
  before: string;
}

/** The calendar year a day is in, such as the campus day of today. */
export function yearDaysOf(day: string): YearDays {
  const year = Number(day.slice(0, 4));
  return { from: `${year}-01-01`, before: `${year + 1}-01-01` };
}

/**
 * Whether "Penggantian tahun ini" counts a replacement on a day: one that
 * is not cancelled and whose start date is in the calendar year of that
 * day. One that waits for a date of this year counts already.
 */
export function countsThisYear(
  replacement: { startsOn: string; cancelledAt: Date | null },
  today: string,
): boolean {
  if (replacement.cancelledAt !== null) return false;
  const year = yearDaysOf(today);
  return (
    replacement.startsOn >= year.from && replacement.startsOn < year.before
  );
}
