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
 */
export const LEAVE_STATUSES = [
  "submitted",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

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
