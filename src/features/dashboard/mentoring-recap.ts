/*
 * Pendampingan of the Dashboard, as it may leave the server. Read by the
 * screen parts, so nothing here may take from the database code.
 */

/** The four numbers of Pendampingan, of the students of the Dashboard. */
export interface MentoringNumbers {
  /**
   * The Aktif students the account sees without any filter, for "dari (n)
   * mahasiswa aktif", or null while no filter is in use.
   */
  everyone: number | null;
  /** Today's mentors of the groups in force the students are in. */
  mentors: number;
  /** Those groups. */
  groups: number;
  /** The mentoring notes about the students of the last 30 days, today included. */
  recentNotes: number;
  /** The students on the coaching list not yet Selesai, as Pembinaan counts them. */
  openCoaching: number;
  /** Those of them whose coaching is Intensif. */
  intensiveCoaching: number;
}

/** One bar of "Capaian MEDALI per program studi". */
export interface ProgramAverage {
  programId: number;
  name: string;
  /** The Aktif students of the program in the group. */
  students: number;
  /** The average Rerata, to one decimal; null while fewer than 5 are assessed. */
  average: number | null;
}

/** Section Pendampingan. */
export interface MentoringView {
  numbers: MentoringNumbers;
  /** Highest first; null for an account that may not pick a program studi. */
  programs: ProgramAverage[] | null;
}
