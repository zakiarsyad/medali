import type { ValueKey } from "@/ui/medali-values";
import type { AttendanceStatus } from "./attendance-status";
import type { StatusParts } from "./schedule-status";

/** The attendance of the student at a schedule, as their own page shows it. */
export interface OwnAttendance {
  status: AttendanceStatus;
  /** Empty when nothing was noted. */
  note: string;
  /** Null for an attendance without a photo, as a dispensation. */
  sentAt: Date | null;
}

/** A schedule that is meant for a student, as their own page shows it. */
export interface StudentSchedule extends StatusParts {
  id: string;
  /** The hour and minute it ends, such as 11:30. */
  endTime: string;
  /** Empty when no place was given. */
  location: string;
  isRequired: boolean;
  /** The activity as Kurikulum has it now. */
  name: string;
  description: string;
  valueKeys: ValueKey[];
  /** The newest attendance of the student at it, or null with nothing sent. */
  attendance: OwnAttendance | null;
}
