/** The fixed sizes of Pembersihan asrama. */

/** How long the name of a cleaning place is, without spaces around it. */
export const PLACE_NAME_MIN_LENGTH = 3;
export const PLACE_NAME_MAX_LENGTH = 60;

/** How many rooms cleaning their own room one page of a dorm lists. */
export const OWN_ROOM_PAGE_SIZE = 20;

/** How many duties of their room a resident sees. */
export const RESIDENT_DUTIES_SHOWN = 20;

/**
 * Where a cleaning duty stands: it waits to be judged (Terjadwal), BAM
 * judged it and it waits for Pengelola Asrama (Dinilai BAM), or Pengelola
 * Asrama validated it (Divalidasi).
 */
export const CLEANING_STATUSES = ["scheduled", "judged", "validated"] as const;

export type CleaningStatus = (typeof CLEANING_STATUSES)[number];

/** What BAM judges a duty: Memenuhi or Tidak memenuhi. */
export const CLEANING_RESULTS = ["met", "not_met"] as const;

export type CleaningResult = (typeof CLEANING_RESULTS)[number];

/** What a line of the log of a duty's judgements records. */
export const CLEANING_STEPS = ["judged", "sent_back", "validated"] as const;

export type CleaningStep = (typeof CLEANING_STEPS)[number];

/** The most letters a Catatan of a judgement or a reason to send it back holds. */
export const CLEANING_NOTE_MAX_LENGTH = 200;

/** The fewest letters a reason for "Tolak penilaian" holds. */
export const SEND_BACK_MIN_LETTERS = 5;

/** How many rooms one page of "Skor kebersihan kamar" lists. */
export const RANKING_PAGE_SIZE = 20;
