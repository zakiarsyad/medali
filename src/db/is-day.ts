const YEAR_MONTH_DAY = /^\d{4}-\d{2}-\d{2}$/;
/** PostgreSQL has no year zero, and refuses to keep a day of it. */
const YEAR_ZERO = "0000-";

/**
 * Whether what was sent is a real day written as year-month-day, the way
 * the database keeps a day.
 */
export function isDay(sent: string): boolean {
  if (!YEAR_MONTH_DAY.test(sent)) return false;
  if (sent.startsWith(YEAR_ZERO)) return false;
  const at = new Date(`${sent}T00:00:00Z`);
  if (Number.isNaN(at.getTime())) return false;
  // A day that does not exist, such as 30 February, rolls into the next month.
  return at.toISOString().startsWith(sent);
}
