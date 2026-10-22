/*
 * The Kategori and Jenjang of a discipline penalty, with their words and
 * their order. Read by the screen parts in the browser, so nothing here
 * may take from the database code.
 */

/** Kategori hukuman disiplin: Ringan, Sedang and Berat. */
export const PENALTY_CATEGORIES = ["light", "medium", "heavy"] as const;

export type PenaltyCategory = (typeof PENALTY_CATEGORIES)[number];

/** Jenjang: pertama, kedua and ketiga. */
export const PENALTY_LEVELS = [1, 2, 3] as const;

export type PenaltyLevel = (typeof PENALTY_LEVELS)[number];

/** A Kategori with its Jenjang. */
export interface PenaltyKind {
  category: PenaltyCategory;
  level: PenaltyLevel;
}

export const CATEGORY_WORDS: Record<PenaltyCategory, string> = {
  light: "Ringan",
  medium: "Sedang",
  heavy: "Berat",
};

export const LEVEL_WORDS: Record<PenaltyLevel, string> = {
  1: "pertama",
  2: "kedua",
  3: "ketiga",
};

/** The place of a Jenjang from Ringan pertama, 0, to Berat ketiga, 8. */
export function rankOf(category: PenaltyCategory, level: PenaltyLevel): number {
  return PENALTY_CATEGORIES.indexOf(category) * 3 + (level - 1);
}

/** A Kategori and Jenjang inside a sentence: "ringan jenjang pertama". */
export function kindWords(kind: PenaltyKind): string {
  return `${CATEGORY_WORDS[kind.category].toLowerCase()} jenjang ${LEVEL_WORDS[kind.level]}`;
}
