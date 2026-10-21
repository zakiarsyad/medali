/*
 * The fixed values of the calls and warning letters (Surat Peringatan,
 * SP) of the dorm. Read by the table definitions and by the screen parts
 * in the browser, so nothing here may take from the database code.
 */

/** SP 1, and SP 2 with its proposal of a discipline punishment. */
export const WARNING_LEVELS = [1, 2] as const;

export type WarningLevel = (typeof WARNING_LEVELS)[number];

/**
 * How many counted violations of a semester call a resident for SP 1,
 * and how many in all, before and after SP 1, for SP 2: 7, then 5 more.
 * The prototype's values, to be confirmed by the campus.
 */
export const SP1_VIOLATIONS = 7;
export const SP2_VIOLATIONS = 12;

/**
 * How many rejected clarifications of a semester call a resident for SP
 * 1, and how many in all for SP 2: one, then another.
 */
export const SP1_REJECTIONS = 1;
export const SP2_REJECTIONS = 2;

/** When and where a resident is called to explain. */
export interface CallSchedule {
  day: string;
  /** As 16:00. */
  time: string;
  place: string;
}

/**
 * What a line of the log of a call and its SP records; "handled" is
 * Kepala Unit marking the proposal of an SP 2 Diproses.
 */
export const WARNING_CHANGE_ACTIONS = [
  "scheduled",
  "issued",
  "handled",
] as const;

export type WarningChangeAction = (typeof WARNING_CHANGE_ACTIONS)[number];

/** How long Tempat is, without spaces around it. */
export const PLACE_MIN_LENGTH = 3;
export const PLACE_MAX_LENGTH = 100;

/** How long Hasil klarifikasi is, without spaces around it. */
export const RESULT_MIN_LENGTH = 10;
export const RESULT_MAX_LENGTH = 1000;

/** The most letters "Catatan pengajuan hukuman disiplin ke Kepala UPK" holds. */
export const PROPOSAL_NOTE_MAX_LENGTH = 1000;

/**
 * Where the proposal of an SP 2 stands: Diajukan to Kepala Unit, or
 * Diproses once Kepala Unit handled it.
 */
export type ProposalStatus = "proposed" | "handled";

/** How long "Catatan tindak lanjut" of Kepala Unit is, without spaces around it. */
export const HANDLING_NOTE_MIN_LENGTH = 5;
export const HANDLING_NOTE_MAX_LENGTH = 1000;

/** How many days after today a call may be scheduled at most. */
export const CALL_DAYS_AHEAD_MAX = 30;

/** Where and when the form offers the call to start with, as in the prototype. */
export const DEFAULT_CALL_PLACE = "Kantor Pengelola Asrama";
export const DEFAULT_CALL_TIME = "16:00";

/** How many rows one page of the calls and of the clarifications panel shows. */
export const WARNINGS_PAGE_SIZE = 20;
