import type { ActivityChoice } from "./activity-choice";
import type { PeriodParts } from "./participants";
import type { StatusParts } from "./schedule-status";

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
  activity: ActivityChoice;
  /** The academic period it keeps, which decides who takes part. */
  period: PeriodParts;
  /** Tells one saved state of the schedule from the next one. */
  version: string;
}
