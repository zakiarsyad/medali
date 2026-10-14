/*
 * Read by the table definitions and by the screen parts in the browser,
 * so nothing here may take from the database code.
 */

/** What a count holds for one participant: Tidak hadir or not, and Catatan. */
export interface CountMark {
  isAbsent: boolean;
  /** Empty when no note was written. */
  note: string;
}

/**
 * The marks of a count by the id of the student. A log line holds only
 * the participants who are absent or have a note: every other one was
 * Hadir without a note.
 */
export type CountMarks = Record<string, CountMark>;

/** The longest Catatan of one participant. */
export const NOTE_MAX_LENGTH = 200;
