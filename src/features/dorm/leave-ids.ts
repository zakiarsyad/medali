/*
 * Read by the table definitions and by the screen parts in the browser,
 * so nothing here may take from the database code.
 */

/**
 * The kinds of dorm leave: Izin pesiar (out for less than 12 hours, not
 * overnight), Izin Tidak Mengikuti Kegiatan (ITMK, skipping the dorm
 * activities of a time range) and Izin khusus (other needs, overnight
 * allowed), in the order the form offers them.
 */
export const LEAVE_KINDS = ["outing", "skip_activities", "special"] as const;

export type LeaveKind = (typeof LEAVE_KINDS)[number];

/**
 * Where a leave request stands: it waits for Pengelola Asrama (Diajukan),
 * was approved or rejected, or the resident cancelled it while it waited.
 * Approved Izin pesiar and Izin khusus become Selesai once their return is
 * validated or recorded; ITMK stays approved, as it needs no return.
 */
export const LEAVE_STATUSES = [
  "submitted",
  "approved",
  "rejected",
  "cancelled",
  "completed",
] as const;

export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

/** The statuses of approved leave, before and after its return. */
export const APPROVED_STATUSES = [
  "approved",
  "completed",
] as const satisfies readonly LeaveStatus[];

/**
 * Where a report of a return stands: it waits for BAM - BPHK (Menunggu
 * verifikasi BAM), BAM verified it and it waits for Pengelola Asrama
 * (Diverifikasi BAM), one of them rejected it, or Pengelola validated it.
 */
export const REPORT_STATUSES = [
  "waiting",
  "verified",
  "rejected",
  "validated",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** The statuses of a report that still waits for a decision. */
export const OPEN_REPORT_STATUSES = [
  "waiting",
  "verified",
] as const satisfies readonly ReportStatus[];

/** How many minutes before the return time a report may be sent. */
export const REPORT_OPENS_MINUTES = 30;

/** Jenis keperluan of Izin khusus, in the order the form offers them. */
export const SPECIAL_REASONS = [
  "sick",
  "family",
  "competition",
  "administration",
  "other",
] as const;

export type SpecialReason = (typeof SPECIAL_REASONS)[number];

/** The fewest letters Keperluan holds, and the most. */
export const PURPOSE_MIN_LENGTH = 5;
export const PURPOSE_MAX_LENGTH = 500;

/** The most letters Tujuan, Kontak and the note of a decision hold. */
export const DESTINATION_MAX_LENGTH = 200;
export const CONTACT_MAX_LENGTH = 100;
export const DECISION_NOTE_MAX_LENGTH = 500;

/** Izin pesiar lasts less than this many hours. */
export const OUTING_MAX_HOURS = 12;

/** The longest leave of any kind, in days. */
export const LEAVE_MAX_DAYS = 30;

/** How far ahead a leave may start, in days. */
export const LEAVE_MAX_DAYS_AHEAD = 366;
