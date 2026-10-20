import type { SessionKind } from "./session-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** What "Catat sesi" opens with for a schedule marked Selesai. */
export interface SessionStart {
  scheduleId: string;
  studentId: string;
  /** The student's name, said above the form. */
  name: string;
  day: string;
  kind: SessionKind;
}

/**
 * What "Tandai selesai" opens: "Catat sesi" for the schedule, only the
 * consent message, or nothing.
 */
export type ScheduleSession =
  | { kind: "open"; start: SessionStart }
  | { kind: "needs_consent" }
  | { kind: "none" };
