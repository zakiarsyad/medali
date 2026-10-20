import type { Predicate } from "./assessment-score";

/*
 * How a predikat is written. Read by the screen parts in the browser, so
 * nothing here may take from the database code.
 */

/** The predikat of the Skala predikat MEDALI. */
export const PREDICATE_WORDS: Record<Predicate, string> = {
  gold: "Emas",
  silver: "Perak",
  bronze: "Perunggu",
  guidance: "Perlu pembinaan",
};

/** What a student without any assessment shows. */
export const NOT_ASSESSED = "Belum diasesmen";
