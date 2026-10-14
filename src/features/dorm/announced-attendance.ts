/*
 * What staff see of an announced count. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** A participant absent or with a note, as Rincian lists them. */
export interface MarkedParticipant {
  studentId: string;
  name: string;
  nim: string;
  isAbsent: boolean;
  note: string;
}

/**
 * The announced count of an activity on a day, of the students the
 * account may see.
 */
export interface AnnouncedAttendance {
  announcedAt: Date;
  announcedBy: string;
  present: number;
  absent: number;
  /** Those absent or with a note, by name. */
  marked: MarkedParticipant[];
}

/** The announced counts of a day, by the id of their activity. */
export type DayAttendance = Record<string, AnnouncedAttendance>;
