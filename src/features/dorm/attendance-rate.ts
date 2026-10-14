/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/**
 * Kehadiran: the share of those counted who were Hadir, as a whole
 * percentage, or null when no one was counted.
 */
export function attendanceRate(
  present: number,
  counted: number,
): number | null {
  if (counted === 0) return null;
  return Math.round((present / counted) * 100);
}

/** A percentage as the screens show it, such as 93%, or "-" for none. */
export function rateWords(rate: number | null): string {
  return rate === null ? "-" : `${rate}%`;
}
