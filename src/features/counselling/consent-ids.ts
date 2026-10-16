/*
 * The fixed facts of a student's consent to counselling. Read by the
 * screen parts in the browser and by the table definitions, so nothing
 * here may take from the database code.
 */

/** Menunggu, Disetujui, Ditolak and Dicabut. No consent at all is Belum diminta. */
export const CONSENT_STATUSES = [
  "waiting",
  "approved",
  "declined",
  "withdrawn",
] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

/** How a consent was given: on the student's own page, or on a signed paper form. */
export const CONSENT_WAYS = ["online", "paper"] as const;

export type ConsentWay = (typeof CONSENT_WAYS)[number];
