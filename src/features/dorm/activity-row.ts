import {
  type ActivityCategory,
  type ActivityPattern,
  type Audience,
  ONE_OFF,
  type Organiser,
  type RundownLine,
} from "./activity-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code: that would send it to the browser with them.
 */

/**
 * A dorm activity as one of its versions holds it, with the days that
 * version is shown for and the days off of the activity.
 */
export interface ActivityRow {
  id: string;
  /** Told from the last change of the activity: see `versionOf`. */
  version: string;
  /** The first and last day shown with these values; null for no limit. */
  shownFrom: string | null;
  shownUntil: string | null;
  /** The first day a removed activity no longer takes place. */
  removedFrom: string | null;
  name: string;
  category: ActivityCategory;
  location: string;
  pattern: ActivityPattern;
  weekdays: number[];
  monthDay: number | null;
  /** Berlaku mulai, or the date of a one-off activity. */
  startsOn: string;
  endsOn: string | null;
  /** The hour and minute, such as 05:30. */
  startTime: string;
  endTime: string;
  organiser: Organiser;
  organiserName: string;
  audience: Audience;
  isRequired: boolean;
  rundown: RundownLine[];
  daysOff: string[];
}

/** Whether an activity repeats (rutin), or takes place once (non rutin). */
export function isRoutine(activity: Pick<ActivityRow, "pattern">): boolean {
  return activity.pattern !== ONE_OFF;
}

/**
 * Whether a row is what its activity holds now: its newest version, of an
 * activity that is not removed. Only such a row can be changed.
 */
export function isCurrent(
  row: Pick<ActivityRow, "shownUntil" | "removedFrom">,
): boolean {
  return row.shownUntil === null && row.removedFrom === null;
}
