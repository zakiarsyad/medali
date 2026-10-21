import type { ConsentStatus } from "./consent-ids";
import type { Instrument, ScreeningLevel } from "./screening-ids";
import type { ScalePart } from "./screening-rules";
import type { SharingStatus } from "./sharing-ids";

/*
 * What the server sends Konselor of the screenings. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

/** The three numbers of Konselor. */
export interface ScreeningNumbers {
  /** "Sudah diasesmen": the students with a screening. */
  screened: number;
  /** "Perlu konseling": those whose latest screening is Sedang or above. */
  needCounselling: number;
  /** "Menunggu persetujuan": those whose consent is Menunggu. */
  waitingConsent: number;
}

/** One screened student of "Daftar mahasiswa", by their latest screening. */
export interface ScreeningRow {
  studentId: string;
  name: string;
  nim: string;
  program: string;
  mentorName: string | null;
  instrument: Instrument;
  screenedOn: string;
  level: ScreeningLevel;
  /** Self-harm was ticked: the mark "Risiko". */
  risk: boolean;
  /** The consent to counselling, or null when never asked. */
  consent: ConsentStatus | null;
  /** "Konseling": how many sessions were written down. */
  sessions: number;
  /** "Sesi berikutnya" of the latest session while it has not passed. */
  nextDay: string | null;
  /** "Publikasi": the status of the latest sharing, or null for none. */
  sharing: SharingStatus | null;
}

export interface ScreeningList {
  rows: ScreeningRow[];
  /** How many students match the search and the filter. */
  matching: number;
  page: number;
}

/** One screening as "Rincian" shows it. */
export interface ScreeningDetailItem {
  id: string;
  screenedOn: string;
  instrument: Instrument;
  level: ScreeningLevel;
  /** The DASS-21 scales, doubled; none for SRQ-20. */
  scales: ScalePart[];
  /** The SRQ-20 number of "ya"; none for DASS-21. */
  srqYes: number | null;
  advice: string;
  risk: boolean;
  /** "Catatan konselor (rahasia)". */
  note: string;
}
