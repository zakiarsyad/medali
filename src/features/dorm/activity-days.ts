import { daysAfter } from "@/academic-periods/days-after";
import type { ActivityRow } from "./activity-row";

/** What tells the days a version of an activity takes place on. */
export type DayFacts = Pick<
  ActivityRow,
  | "shownFrom"
  | "shownUntil"
  | "removedFrom"
  | "pattern"
  | "weekdays"
  | "monthDay"
  | "startsOn"
  | "endsOn"
  | "daysOff"
>;

/** How far ahead the next activities are looked for: one year. */
const DAYS_AHEAD = 366;

function isWithin(
  day: string,
  from: string | null,
  until: string | null,
): boolean {
  if (from !== null && day < from) return false;
  return until === null || day <= until;
}

/** The day of the week of a day: 0 for Minggu to 6 for Sabtu. */
function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

/** The date in its month of a day: 14 for 2026-10-14. */
function monthDayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDate();
}

function repeatsOn(facts: DayFacts, day: string): boolean {
  if (facts.pattern === "weekly")
    return facts.weekdays.includes(weekdayOf(day));
  if (facts.pattern === "monthly") return facts.monthDay === monthDayOf(day);
  // A daily activity takes place every day, and a one-off on its one day.
  return true;
}

/**
 * Whether a version of an activity takes place on a day: the day is one
 * the version is shown for, before the day a removed activity stopped,
 * within Berlaku mulai and Berlaku sampai, not a day off, and one the
 * pattern repeats on.
 */
export function takesPlaceOn(facts: DayFacts, day: string): boolean {
  if (!isWithin(day, facts.shownFrom, facts.shownUntil)) return false;
  if (facts.removedFrom !== null && day >= facts.removedFrom) return false;
  if (!isWithin(day, facts.startsOn, facts.endsOn)) return false;
  if (facts.daysOff.includes(day)) return false;
  return repeatsOn(facts, day);
}

/** An activity on one of the days it takes place. */
export interface Occurrence<Row> {
  day: string;
  activity: Row;
}

function byStartTime(
  a: Pick<ActivityRow, "startTime" | "name">,
  b: Pick<ActivityRow, "startTime" | "name">,
): number {
  if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
  return a.name.localeCompare(b.name, "id");
}

/** The rows that take place on a day, the earliest hour first. */
export function takingPlaceOn<Row extends ActivityRow>(
  rows: Row[],
  day: string,
): Row[] {
  return rows.filter((row) => takesPlaceOn(row, day)).sort(byStartTime);
}

/**
 * The next times any of the rows takes place after a day, the soonest
 * first, at most `limit` of them and none more than a year ahead.
 */
export function nextOccurrences<Row extends ActivityRow>(
  rows: Row[],
  after: string,
  limit: number,
): Occurrence<Row>[] {
  const found: Occurrence<Row>[] = [];
  for (let ahead = 1; ahead <= DAYS_AHEAD; ahead++) {
    if (found.length >= limit) break;
    const day = daysAfter(after, ahead);
    for (const activity of takingPlaceOn(rows, day)) {
      found.push({ day, activity });
    }
  }
  return found.slice(0, limit);
}
