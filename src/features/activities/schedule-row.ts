import type { PeriodParts } from "./participants";
import type { StatusParts } from "./schedule-status";

/** The Kurikulum activity a schedule holds, as it is in Kurikulum now. */
export interface ScheduledActivity {
  name: string;
  semester: number;
  indicatorCodes: string[];
  /** Null while no target is set. */
  targetParticipants: number | null;
}

/** One schedule as the list shows it. */
export interface ScheduleRow extends StatusParts {
  id: string;
  /** The hour and minute it ends, such as 11:30. */
  endTime: string;
  /** Empty when no place was given. */
  location: string;
  isRequired: boolean;
  activity: ScheduledActivity;
  /** The academic period it keeps, which decides who takes part. */
  period: PeriodParts;
}
