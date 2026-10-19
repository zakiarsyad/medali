import type {
  CounsellingHour,
  CounsellingTopic,
  CounsellingWay,
  ScheduleStatus,
  ScheduleStep,
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

/** One line of "Riwayat langkah": when, who and which step. */
export interface ScheduleStepView {
  id: string;
  /** The moment as a log shows it, such as 11 Okt 2026, 14.05. */
  at: string;
  by: string;
  step: ScheduleStep;
}

/** One request as Konselor's "Jadwal konseling" shows it. */
export interface CounsellorScheduleCard {
  id: string;
  name: string;
  nim: string;
  program: string;
  status: ScheduleStatus;
  topic: CounsellingTopic;
  day: string;
  hour: CounsellingHour;
  way: CounsellingWay;
  /** "Cerita mahasiswa (rahasia)". */
  story: string | null;
  /** Why the student asked for another time, when they did. */
  reason: string | null;
  /** The Konselor of a proposed or agreed time; null before. */
  counsellorName: string | null;
  /** Every step, oldest first. */
  steps: ScheduleStepView[];
  version: string;
}

/** The numbers above the cards. */
export interface ScheduleCounts {
  /** Diajukan: "Perlu dijadwalkan". */
  submitted: number;
  /** Dijadwalkan from today to 7 days ahead. */
  scheduledSoon: number;
  /** Usulan jadwal lain: "Menunggu konfirmasi mahasiswa". */
  proposed: number;
}

/** The numbers, and one page of the cards that match the filter. */
export interface ScheduleBoard {
  counts: ScheduleCounts;
  cards: CounsellorScheduleCard[];
  /** How many cards match the filter in all. */
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}
