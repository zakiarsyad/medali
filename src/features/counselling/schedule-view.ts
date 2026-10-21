import type {
  CounsellingHour,
  CounsellingWay,
  ScheduleKind,
  ScheduleStatus,
  ScheduleStep,
  ScheduleTopic,
} from "./schedule-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** One active request of the student, as "Jadwal konseling saya" shows it. */
export interface OwnScheduleView {
  id: string;
  kind: ScheduleKind;
  status: ScheduleStatus;
  topic: ScheduleTopic;
  /**
   * The time it is about now: wished, proposed or agreed. None while an
   * assignment waits for Konselor to set one.
   */
  day: string | null;
  hour: CounsellingHour | null;
  way: CounsellingWay | null;
  /** The Konselor of an agreed time; null before. */
  counsellorName: string | null;
  /** "Pesan konselor" of a proposed or agreed time; null otherwise. */
  counsellorMessage: string | null;
  /** What a press sends back, so a change made since is caught. */
  version: string;
}

/** One request that is over, as the student's "Riwayat" shows it. */
export interface OwnHistoryView {
  id: string;
  kind: ScheduleKind;
  status: ScheduleStatus;
  /** The day it was about. */
  day: string;
  topic: ScheduleTopic;
}

/** The lines of "Riwayat" read, the latest first. */
export interface OwnHistoryPage {
  items: OwnHistoryView[];
  /** Whether there are more than those read. */
  hasMore: boolean;
}

/** "Riwayat" as the student's page shows it. */
export interface OwnHistory extends OwnHistoryPage {
  /** How many lines the page asked for. */
  shown: number;
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
  kind: ScheduleKind;
  status: ScheduleStatus;
  topic: ScheduleTopic;
  /** None while an assignment waits for Konselor to set a time. */
  day: string | null;
  hour: CounsellingHour | null;
  way: CounsellingWay | null;
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
