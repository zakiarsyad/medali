/*
 * The fixed values of an appeal (advokasi) of a dorm violation. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** Advokasi diproses, Advokasi diterima, or rejected: Naik ke Pengelola. */
export const APPEAL_STATUSES = ["waiting", "accepted", "rejected"] as const;

export type AppealStatus = (typeof APPEAL_STATUSES)[number];

/**
 * How long Alasan advokasi is, without spaces around it. The least is
 * the prototype's value, to be confirmed by the campus.
 */
export const APPEAL_REASON_MIN_LENGTH = 15;
export const APPEAL_REASON_MAX_LENGTH = 500;

/** The most letters "Catatan BAM" holds. */
export const APPEAL_NOTE_MAX_LENGTH = 500;

/** Where the proof files of appeals go in the file storage. */
export const APPEAL_PROOF_FOLDER = "dorm-violation-appeals";
