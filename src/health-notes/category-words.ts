/*
 * How a category is written on screen. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

import type { ScoreRange, ShownCategory } from "./fitness-category";
import type { FitnessCategory } from "./fitness-ids";

/** Each category, and Belum dites, in the prototype's words. */
export const CATEGORY_WORDS: Record<ShownCategory, string> = {
  excellent: "Prima",
  good: "Baik",
  attention: "Perlu perhatian",
  medical: "Perlu tindak lanjut medis",
  untested: "Belum dites",
};

/** What each category means, in the prototype's words. */
export const CATEGORY_MEANINGS: Record<FitnessCategory, string> = {
  excellent: "Kebugaran sangat baik, tidak perlu catatan.",
  good: "Kebugaran baik, tidak perlu catatan.",
  attention: "Perlu pemantauan; lengkapi catatan kesehatan.",
  medical:
    "Perlu pemeriksaan atau penanganan medis; lengkapi catatan kesehatan.",
};

/** The scores of a category, such as 85–100. */
export function rangeWords(range: ScoreRange): string {
  return `${range.lowest}–${range.highest}`;
}
