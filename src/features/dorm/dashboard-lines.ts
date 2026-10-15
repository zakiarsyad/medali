import type { CampusMoment } from "@/academic-periods/campus-clock";
import { daysAfter } from "@/academic-periods/days-after";
import { takingPlaceOn } from "./activity-days";
import type { ActivityRow } from "./activity-row";
import { type ActivityState, activityState } from "./activity-state";
import {
  type Attendance,
  type Changed,
  type MarkGroup,
  type Place,
  tallyWhere,
} from "./dashboard-tally";

/*
 * The activities Dashboard asrama looks at: today's and those of the 7
 * dates before, as in the prototype, with their announced counts.
 */

/** How many dates before today Dashboard asrama looks back. */
const DAYS_BACK = 7;

/** The first day Dashboard asrama looks at. */
export function firstDayShown(today: string): string {
  return daysAfter(today, -DAYS_BACK);
}

/** The first and the last day Dashboard asrama looks at. */
export interface DaysShown {
  first: string;
  last: string;
}

export function daysShown(today: string): DaysShown {
  return { first: firstDayShown(today), last: today };
}

/** An announced count, by its activity and day. */
export interface AnnouncedCount {
  id: string;
  activityId: string;
  day: string;
}

/** An activity on one of the days shown. */
export interface ActivityLine {
  day: string;
  activity: ActivityRow;
  state: ActivityState;
  /** The id of its announced count; null while none is announced. */
  countId: string | null;
}

function countOf(
  counts: AnnouncedCount[],
  activityId: string,
  day: string,
): string | null {
  const found = counts.find(
    (count) => count.activityId === activityId && count.day === day,
  );
  return found?.id ?? null;
}

/**
 * Every activity of today and the 7 dates before, as Jadwal harian shows
 * each day, the latest first, with its state now and its announced count.
 */
export function linesOf(
  rows: ActivityRow[],
  counts: AnnouncedCount[],
  now: CampusMoment,
): ActivityLine[] {
  const lines: ActivityLine[] = [];
  for (let back = 0; back <= DAYS_BACK; back++) {
    const day = daysAfter(now.day, -back);
    for (const activity of takingPlaceOn(rows, day).reverse()) {
      lines.push({
        day,
        activity,
        state: activityState({ ...activity, day }, now),
        countId: countOf(counts, activity.id, day),
      });
    }
  }
  return lines;
}

/**
 * Whether a line counts towards Kehadiran: its count is announced and
 * the activity is over, as on Kegiatan asrama.
 */
export function isCounted(line: ActivityLine): boolean {
  return line.countId !== null && line.state === "over";
}

/** Hadir, Tidak hadir and Izin of a line's announced count, or null without one. */
export function attendanceOfLine(
  line: ActivityLine,
  groups: MarkGroup[],
  changed: Changed[],
): Attendance | null {
  if (line.countId === null) return null;
  const { countId } = line;
  return tallyWhere(groups, changed, (place) => place.countId === countId);
}

/** The attendance of some activities, and how many they are. */
export interface CountedAttendance {
  attendance: Attendance;
  activities: number;
}

function countedOf(
  lines: ActivityLine[],
  groups: MarkGroup[],
  changed: Changed[],
  keeps: (place: Place) => boolean = () => true,
): CountedAttendance {
  const ids = new Set<string>();
  for (const line of lines) {
    if (isCounted(line) && line.countId !== null) ids.add(line.countId);
  }
  const attendance = tallyWhere(
    groups,
    changed,
    (place) => ids.has(place.countId) && keeps(place),
  );
  return { attendance, activities: ids.size };
}

/** Kehadiran 7 hari terakhir: the announced activities that are over. */
export function overallAttendance(
  lines: ActivityLine[],
  groups: MarkGroup[],
  changed: Changed[],
): CountedAttendance {
  return countedOf(lines, groups, changed);
}
