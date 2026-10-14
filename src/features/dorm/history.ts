import type { CampusMoment } from "@/academic-periods/campus-clock";
import { daysAfter } from "@/academic-periods/days-after";
import { type Occurrence, takingPlaceOn } from "./activity-days";
import type { ActivityRow } from "./activity-row";
import { activityState } from "./activity-state";

/*
 * Riwayat: the activities of a resident that are over, with what was
 * announced of each. Read by the screen parts in the browser, so nothing
 * here may take from the database code.
 */

/** How far back Riwayat looks for activities: one year. */
const DAYS_BACK = 366;

/**
 * Where a resident stands at an activity that is over. Izin is what
 * approved leave gives an announced count.
 */
export type HistoryStatus = "present" | "absent" | "leave" | "not_announced";

export const HISTORY_STATUS_WORDS: Record<HistoryStatus, string> = {
  present: "Hadir",
  absent: "Tidak hadir",
  leave: "Izin",
  not_announced: "Belum diumumkan",
};

/** An activity on one day, as Riwayat names it. */
export interface HeldActivity {
  activityId: string;
  day: string;
  name: string;
  /** The hour and minute it started, such as 05:30. */
  startTime: string;
}

/** The resident's own mark in an announced count. */
export interface OwnMark extends HeldActivity {
  isAbsent: boolean;
  note: string;
}

/** An own mark with the hour its activity ended, such as 06:15. */
export interface TimedMark extends OwnMark {
  endTime: string;
}

/** How often a resident was Hadir and Tidak hadir. */
export interface Tally {
  present: number;
  absent: number;
}

/**
 * The marks whose activity is over at a moment on campus, without their
 * end hour. A count may be announced once its activity starts, but it
 * counts for the resident only once the activity is over.
 */
export function marksOver(marks: TimedMark[], now: CampusMoment): OwnMark[] {
  const over: OwnMark[] = [];
  for (const { endTime, ...mark } of marks) {
    const state = activityState({ ...mark, endTime }, now);
    if (state === "over") over.push(mark);
  }
  return over;
}

/** How many of the marks are Hadir and how many Tidak hadir. */
export function tallyOf(marks: OwnMark[]): Tally {
  const absent = marks.filter((mark) => mark.isAbsent).length;
  return { present: marks.length - absent, absent };
}

export interface HistoryEntry extends HeldActivity {
  status: HistoryStatus;
  note: string;
}

/** The key of an activity on a day. */
export function heldKey(held: { day: string; activityId: string }): string {
  return `${held.day} ${held.activityId}`;
}

function latestFirst(a: HeldActivity, b: HeldActivity): number {
  if (a.day !== b.day) return a.day < b.day ? 1 : -1;
  if (a.startTime !== b.startTime) return a.startTime < b.startTime ? 1 : -1;
  return a.name.localeCompare(b.name, "id");
}

/**
 * The times the rows took place that are over at a moment, the latest
 * first: today's that have ended, then the days before, at most `limit`
 * of them and none more than a year back.
 */
export function pastOccurrences<Row extends ActivityRow>(
  rows: Row[],
  now: CampusMoment,
  limit: number,
): Occurrence<Row>[] {
  const found: Occurrence<Row>[] = [];
  for (let back = 0; back <= DAYS_BACK; back++) {
    if (found.length >= limit) break;
    const day = daysAfter(now.day, -back);
    const held = takingPlaceOn(rows, day).reverse();
    for (const activity of held) {
      const state = activityState({ ...activity, day }, now);
      if (state === "over") found.push({ day, activity });
    }
  }
  return found.slice(0, limit);
}

/**
 * Riwayat, the latest first and at most `limit` entries: the resident's
 * own mark of each announced count, Hadir or Tidak hadir with its note,
 * also of an activity no longer shown on its day, and "Belum diumumkan"
 * for an activity that is over without an announcement. An activity
 * announced without them, held before they took part, is left out.
 */
export function historyOf(
  held: HeldActivity[],
  marks: OwnMark[],
  announced: ReadonlySet<string>,
  limit: number,
): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const marked = new Set<string>();
  for (const { isAbsent, ...mark } of marks) {
    marked.add(heldKey(mark));
    entries.push({ ...mark, status: isAbsent ? "absent" : "present" });
  }
  for (const activity of held) {
    const key = heldKey(activity);
    if (marked.has(key) || announced.has(key)) continue;
    entries.push({ ...activity, status: "not_announced", note: "" });
  }
  return entries.sort(latestFirst).slice(0, limit);
}
