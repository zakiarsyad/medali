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

/**
 * How a consent was given: on the student's own page, on a signed paper
 * form, or by ticking it when registering for voluntary counselling.
 */
export const CONSENT_WAYS = ["online", "paper", "registration"] as const;

export type ConsentWay = (typeof CONSENT_WAYS)[number];
