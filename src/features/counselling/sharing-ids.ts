/*
 * The fixed facts of sharing a counselling summary ("Publikasi data
 * kesehatan mental"). Read by the screen parts in the browser and by the
 * table definitions, so nothing here may take from the database code.
 */

/**
 * Menunggu persetujuan, Disetujui, Ditolak, Dipublikasikan, Ditarik by
 * Konselor and Dicabut by the student.
 */
export const SHARING_STATUSES = [
  "waiting",
  "approved",
  "declined",
  "published",
  "cancelled",
  "withdrawn",
] as const;

export type SharingStatus = (typeof SHARING_STATUSES)[number];

/** The statuses of a current sharing: a student has at most one. */
export const CURRENT_SHARING_STATUSES = [
  "waiting",
  "approved",
  "published",
] as const satisfies readonly SharingStatus[];

/**
 * "Data yang dibagikan": the state, schedule and follow-up of the
 * counselling without what was said, and the summary Konselor writes.
 */
export const SHARED_DATA = ["counselling", "summary"] as const;

export type SharedData = (typeof SHARED_DATA)[number];

/**
 * "Penerima": the roles that may be given the data. Ketua Program Studi
 * and Pengasuh read it only of their own students.
 */
export const SHARING_RECIPIENTS = [
  "head_of_unit",
  "director",
  "head_of_program",
  "mentor",
] as const;

export type SharingRecipient = (typeof SHARING_RECIPIENTS)[number];

/** How the student approved: on their own page, or on a signed paper form. */
export const SHARING_WAYS = ["online", "paper"] as const;

export type SharingWay = (typeof SHARING_WAYS)[number];

/**
 * Each step of a sharing, as its log keeps it. `consent_withdrawn` is
 * the stop that follows the student withdrawing their consent to
 * counselling.
 */
export const SHARING_STEPS = [
  "ask",
  "approve",
  "record_paper",
  "decline",
  "publish",
  "cancel",
  "withdraw",
  "consent_withdrawn",
] as const;

export type SharingStep = (typeof SHARING_STEPS)[number];

/** The fewest letters of "Ringkasan untuk penerima", as in the prototype. */
export const SUMMARY_MIN = 10;

/** The most letters of "Ringkasan untuk penerima" kept. */
export const SUMMARY_MAX = 1000;

/** What a sharing gives to whom, as its log keeps it. */
export interface SharingContent {
  data: SharedData[];
  recipients: SharingRecipient[];
  /** "Ringkasan untuk penerima", only when the summary is shared. */
  summary: string | null;
}
