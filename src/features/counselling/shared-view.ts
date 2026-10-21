import type { SessionSummary } from "./session-view";
import type { SharedData } from "./sharing-ids";

/*
 * What the server sends a recipient of shared counselling data. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** How many students "Data yang dipublikasikan untuk Anda" loads at a time. */
export const SHARED_PAGE_SIZE = 20;

/** One student whose data is published for the recipient. */
export interface SharedRow {
  studentId: string;
  name: string;
  nim: string;
  program: string;
  mentorName: string | null;
  /** "Data yang dibagikan": what the student agreed to share. */
  data: SharedData[];
  publishedAt: Date;
}

/** The numbers a recipient sees beside "Sudah diasesmen". */
export interface SharedNumbers {
  /** "Dipublikasikan untuk Anda". */
  forYou: number;
  menteesOnly: boolean;
  /** "Sesi konseling 30 hari" for the whole campus, "<5" for 1 to 4. */
  sessions: string;
}

export interface SharedList {
  rows: SharedRow[];
  /** "Dipublikasikan untuk Anda": every student published for the recipient. */
  matching: number;
  page: number;
  /** Pengasuh is the recipient's only role named: the list is of mentees. */
  menteesOnly: boolean;
}

/** "Rincian" of a student: only the parts the student agreed to share. */
export interface SharedDetail {
  data: SharedData[];
  /** "Status konseling", when shared; null when not shared or with no session. */
  counselling: SessionSummary | null;
  /** "Ringkasan konselor", when shared. */
  summary: string | null;
  publishedByName: string;
  publishedAt: Date;
}
