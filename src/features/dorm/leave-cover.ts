import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import type { DormId } from "@/dorms/dorms";
import { shownDay } from "@/ui/day";
import { covers } from "./activity-audience";
import { takingPlaceOn } from "./activity-days";
import type { ActivityRow } from "./activity-row";
import { campusTimeOf } from "./leave-time";

/*
 * Which dorm activities a leave covers. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** A dorm activity on one day, as a leave covers it. */
export interface CoveredActivity {
  activityId: string;
  day: string;
  name: string;
  /** The hour and minute it starts and ends, such as 19:30. */
  startTime: string;
  endTime: string;
}

/** The time a leave lasts, from its start up to its end. */
export interface LeaveSpan {
  start: Date;
  end: Date;
}

/**
 * Whether a leave covers an activity on a day: their times overlap, so
 * the leave starts before the activity ends and ends after it starts. A
 * leave that ends as the activity starts does not cover it.
 */
export function coversActivity(
  leave: LeaveSpan,
  held: { day: string; startTime: string; endTime: string },
): boolean {
  const activityStart = `${held.day}T${held.startTime}`;
  const activityEnd = `${held.day}T${held.endTime}`;
  return (
    campusTimeOf(leave.start) < activityEnd &&
    campusTimeOf(leave.end) > activityStart
  );
}

/**
 * The activities of the residents of a dorm that a leave covers, the
 * earliest first, among the rows given.
 */
export function coveredActivities(
  rows: ActivityRow[],
  dorm: DormId,
  leave: LeaveSpan,
): CoveredActivity[] {
  const ofDorm = rows.filter((row) => covers(row.audience, dorm));
  const lastDay = campusDay(leave.end);
  const covered: CoveredActivity[] = [];
  for (let day = campusDay(leave.start); day <= lastDay; ) {
    for (const activity of takingPlaceOn(ofDorm, day)) {
      const held = { day, ...activity };
      if (!coversActivity(leave, held)) continue;
      const { id, name, startTime, endTime } = activity;
      covered.push({ activityId: id, day, name, startTime, endTime });
    }
    day = daysAfter(day, 1);
  }
  return covered;
}

/** A covered activity as a note names it, such as Apel malam 14 Okt 2026 22:00. */
export function coveredWords(activity: CoveredActivity): string {
  return `${activity.name} ${shownDay(activity.day)} ${activity.startTime}`;
}
