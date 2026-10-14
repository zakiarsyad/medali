/*
 * The fixed values of a request for a SIKU gain. Read by the form and
 * the cards in the browser, so nothing here may take from the database
 * code.
 */

/**
 * Where a request stands as it is kept. "Dibatalkan" is not kept: it is
 * told from the gain of an approved request being cancelled.
 */
export const REQUEST_STATUSES = [
  "waiting",
  "approved",
  "rejected",
  "withdrawn",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** The fewest and the most characters of Keterangan (laporan kegiatan). */
export const REPORT_MIN_LENGTH = 20;
export const REPORT_MAX_LENGTH = 1000;

/** The most characters of "Catatan penilai". */
export const DECISION_NOTE_MAX_LENGTH = 500;

/** The fewest and the most photos one request holds. */
export const PHOTOS_MIN = 1;
export const PHOTOS_MAX = 3;
