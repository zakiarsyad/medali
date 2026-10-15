/*
 * The fixed facts of a health note. Read by the screen parts in the
 * browser and by the table definitions, so nothing here may take from
 * the database code.
 */

import type { FitnessCategory } from "./fitness-ids";

/** The choices of "Riwayat penyakit", in the prototype's order. */
export const ILLNESSES = [
  "asthma",
  "hypertension",
  "diabetes",
  "heart_disease",
  "gastric_disorder",
  "allergy",
  "epilepsy",
  "bone_joint_injury",
  "infectious_disease",
  "other",
] as const;

export type Illness = (typeof ILLNESSES)[number];

/**
 * The categories "Pertimbangan kategori" may set. A note never makes a
 * student Prima; without one of these the note follows the fitness test.
 */
export const NOTE_CATEGORIES = ["good", "attention", "medical"] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

/** The most a short field of a note holds: Pemeriksa, Riwayat lain, Obat and each illness's note. */
export const SHORT_TEXT_MAX = 200;

/** The most "Catatan dan rekomendasi" holds. */
export const ADVICE_MAX = 2000;

/** The choices of the recap's filter "Tempat tinggal". */
export const RESIDENCES = ["all", "dorm", "non_dorm"] as const;

export type Residence = (typeof RESIDENCES)[number];

/**
 * The filters a reading of the recap used, as its log keeps them. The
 * searched text is not kept, only that there was one: it is often a
 * name.
 */
export interface RecapReadFilters {
  searched: boolean;
  residence: Residence;
  category: FitnessCategory | "all";
  illness: Illness | "all";
  page: number;
}
