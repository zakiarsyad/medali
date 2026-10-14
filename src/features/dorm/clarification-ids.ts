/*
 * Read by the table definitions and by the screen parts in the browser,
 * so nothing here may take from the database code.
 */

/**
 * Where a clarification of a dorm absence stands: it waits for BAM
 * (Diajukan), BAM passed it on and it waits for Pengelola Asrama
 * (Diverifikasi BAM), Pengelola accepted it, BAM or Pengelola rejected
 * it, or it was closed because BAM withdrew the absence.
 */
export const DORM_CLARIFICATION_STATUSES = [
  "submitted",
  "verified",
  "accepted",
  "rejected",
  "closed",
] as const;

export type DormClarificationStatus =
  (typeof DORM_CLARIFICATION_STATUSES)[number];

/** The statuses of a clarification that still waits for a decision. */
export const WAITING_STATUSES = [
  "submitted",
  "verified",
] as const satisfies readonly DormClarificationStatus[];

/**
 * Why a resident says they were not recorded as present, in the order
 * the form lists them. "Kendala teknis presensi" is left out: the dorm
 * counts its attendance on the spot, with no photo to send.
 */
export const DORM_CLARIFICATION_REASONS = [
  "sick",
  "family_matter",
  "campus_duty",
  "present_not_recorded",
  "other",
] as const;

export type DormClarificationReason =
  (typeof DORM_CLARIFICATION_REASONS)[number];

/** What an accepted clarification makes the resident: Hadir or Izin. */
export const ACCEPTED_AS = ["present", "leave"] as const;

export type AcceptedAs = (typeof ACCEPTED_AS)[number];

/** The part of the file storage that keeps the files of dorm clarifications. */
export const DORM_CLARIFICATION_FOLDER = "dorm-clarifications";

/** The most letters the note of a check or a decision holds. */
export const CLARIFICATION_NOTE_MAX_LENGTH = 200;
