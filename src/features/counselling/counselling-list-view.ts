import type { ConsentStatus } from "./consent-ids";
import type { CounsellingHour, ScheduleStatus } from "./schedule-ids";
import type { SharingStatus } from "./sharing-ids";

/*
 * What the server sends Konselor of "Daftar mahasiswa" on Konseling. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** The two numbers above the list. */
export interface CounsellingNumbers {
  /** "Menunggu persetujuan": the consents that wait for the student. */
  waitingConsent: number;
  /** "Sesi 30 hari terakhir": the sessions held from 30 days ago up to today. */
  recentSessions: number;
}

/** The active schedule a row shows: its status, and its time once set. */
export interface ListSchedule {
  status: ScheduleStatus;
  day: string | null;
  hour: CounsellingHour | null;
}

/** One student of "Daftar mahasiswa". */
export interface CounsellingStudentRow {
  studentId: string;
  name: string;
  nim: string;
  program: string;
  /** "Persetujuan": the consent, or null when never asked. */
  consent: ConsentStatus | null;
  /** How many sessions were written down. */
  sessions: number;
  /** "Sesi berikutnya" of the latest session while it has not passed. */
  nextDay: string | null;
  /** "Jadwal": the active schedule, or null without one. */
  schedule: ListSchedule | null;
  /** "Publikasi": the status of the latest sharing, or null for none. */
  sharing: SharingStatus | null;
}

export interface CounsellingStudentList {
  rows: CounsellingStudentRow[];
  /** How many students match the search and the filter. */
  matching: number;
  page: number;
}
