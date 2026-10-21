import type { FollowUp, SessionContent, SessionKind } from "./session-ids";

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

/** One session in "Riwayat sesi", as Konselor reads it. */
export interface SessionView extends SessionContent {
  id: string;
  /** The Konselor who wrote it down. */
  counsellorName: string;
  /** When and by whom it was changed last; null while never changed. */
  changed: { at: Date; by: string } | null;
  /** What "Simpan perubahan" sends back, so a change made since is caught. */
  version: string;
}

/** "Riwayat sesi" of a student, the latest first. */
export interface SessionHistory {
  items: SessionView[];
  /** Whether there are more than those read. */
  hasMore: boolean;
}

/** What the student sees of their own sessions: never the notes. */
export interface OwnSessionSummary {
  count: number;
  /** The day of the latest session. */
  lastDay: string;
  /** "Sesi berikutnya" of the latest session, when one is set and has not passed. */
  nextDay: string | null;
}

/** The same with "Tindak lanjut" of the latest session, as a recipient reads it. */
export interface SessionSummary extends OwnSessionSummary {
  followUp: FollowUp;
}
