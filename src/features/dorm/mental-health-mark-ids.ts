/*
 * The fixed facts of "Potensi kesehatan mental", the early mark of a
 * dorm resident. Read by the screen parts in the browser and by the
 * table definitions, so nothing here may take from the database code.
 */

/**
 * The marks "Kategori potensi" sets: "Potensi: perlu pemantauan" and
 * "Potensi: perlu dirujuk ke konselor". "Tidak ada indikasi" is no mark.
 */
export const MARK_CATEGORIES = ["monitor", "refer"] as const;

export type MarkCategory = (typeof MARK_CATEGORIES)[number];

/** The most "Pengamatan (rahasia)" holds. */
export const OBSERVATION_MAX = 500;

/** A resident's current mark as a screen shows it. */
export interface MentalHealthMark {
  category: MarkCategory;
  /** "Pengamatan (rahasia)", empty when none was written. */
  observation: string;
}
