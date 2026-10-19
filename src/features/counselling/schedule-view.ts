import type {
  CounsellingHour,
  CounsellingTopic,
  CounsellingWay,
  ScheduleStatus,
} from "./schedule-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** One active request of the student, as "Jadwal konseling saya" shows it. */
export interface OwnScheduleView {
  id: string;
  status: ScheduleStatus;
  topic: CounsellingTopic;
  /** The time it is about now: wished, proposed or agreed. */
  day: string;
  hour: CounsellingHour;
  way: CounsellingWay;
  /** The Konselor of an agreed time; null before. */
  counsellorName: string | null;
  /** "Pesan konselor" of a proposed or agreed time; null otherwise. */
  counsellorMessage: string | null;
  /** What a press sends back, so a change made since is caught. */
  version: string;
}
