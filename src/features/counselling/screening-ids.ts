/*
 * The fixed facts of a mental health screening. Read by the screen parts
 * in the browser and by the table definitions, so nothing here may take
 * from the database code.
 */

/** DASS-21 and SRQ-20. */
export const INSTRUMENTS = ["dass21", "srq20"] as const;

export type Instrument = (typeof INSTRUMENTS)[number];

/** Normal, Ringan, Sedang, Berat and Sangat berat, mildest first. */
export const SCREENING_LEVELS = [
  "normal",
  "mild",
  "moderate",
  "severe",
  "extremely_severe",
] as const;

export type ScreeningLevel = (typeof SCREENING_LEVELS)[number];

/** The highest sum of the seven items of one DASS-21 scale. */
export const DASS_SUM_MAX = 21;

/** The highest number of "ya" answers of SRQ-20. */
export const SRQ_MAX = 20;

/** The longest "Catatan konselor (rahasia)". */
export const SCREENING_NOTE_MAX = 1000;

/** What a line of the log of screenings tells: a save, or an opening of "Rincian". */
export const SCREENING_EVENTS = ["saved", "opened"] as const;
