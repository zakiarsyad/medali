/*
 * How a category is written on screen. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

import type { ShownCategory } from "./fitness-category";

/** Each category, and Belum dites, in the prototype's words. */
export const CATEGORY_WORDS: Record<ShownCategory, string> = {
  excellent: "Prima",
  good: "Baik",
  attention: "Perlu perhatian",
  medical: "Perlu tindak lanjut medis",
  untested: "Belum dites",
};
