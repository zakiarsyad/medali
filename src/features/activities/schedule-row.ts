import type { ActivityChoice } from "./activity-choice";
import type { ShownChoice } from "./chosen-participants";
import type { PeriodParts } from "./participants";
import type { StatusParts } from "./schedule-status";

/** A Kurikulum activity as a schedule shows it, PPKS or extra. */
export type ScheduleActivity = Omit<ActivityChoice, "semester">;

/**
 * Whom a schedule is for: the students of the semester of its PPKS
 * activity, or those chosen for an extra activity, with how many Aktif
 * students that choice holds. That head count is the same for every role
 * and names nobody.
 */
export type ScheduleTarget =
  | { kind: "semester"; semester: number }
  | { kind: "chosen"; choice: ShownChoice; participants: number };

/** One schedule as the list shows it and as its form opens with. */
export interface ScheduleRow extends StatusParts {
  id: string;
  /** The hour and minute it ends, such as 11:30. */
  endTime: string;
  /** Empty when no place was given. */
  location: string;
  /** Whether this schedule counts, whatever Kurikulum says of its activity. */
  isRequired: boolean;
  /**
   * The Kurikulum activity it holds, as it is in Kurikulum now, also when
   * it was removed from the list since.
   */
  activity: ScheduleActivity;
  target: ScheduleTarget;
  /**
   * The academic period it keeps: for a PPKS activity it decides who takes
   * part, and for every schedule which period's score it counts in.
   */
  period: PeriodParts;
  /** Tells one saved state of the schedule from the next one. */
  version: string;
}
