/*
 * The fixed values of Pelanggaran disiplin. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

/** Kategori hukuman disiplin: Ringan, Sedang and Berat. */
export const PENALTY_CATEGORIES = ["light", "medium", "heavy"] as const;

export type PenaltyCategory = (typeof PENALTY_CATEGORIES)[number];

/** Jenjang: pertama, kedua and ketiga. */
export const PENALTY_LEVELS = [1, 2, 3] as const;

export type PenaltyLevel = (typeof PENALTY_LEVELS)[number];

/**
 * The status of a penalty: Dijatuhkan, Sedang dijalani and Selesai
 * dijalani as it is followed up, or Ditetapkan for one that ends the
 * student's status for good.
 */
export const PENALTY_STATUSES = [
  "imposed",
  "serving",
  "served",
  "set",
] as const;

export type PenaltyStatus = (typeof PENALTY_STATUSES)[number];

/**
 * Syarat melanjutkan studi (ayat 7) of a suspended student with an
 * Instansi asal, in the prototype's order: the penalty served, the
 * academic curriculum, the character curriculum, the written
 * recommendation of the agency, and the rules of study leave.
 */
export const CONTINUATION_CONDITIONS = [
  "served",
  "academic",
  "character",
  "recommendation",
  "study_leave",
] as const;

export type ContinuationCondition = (typeof CONTINUATION_CONDITIONS)[number];

/**
 * Keputusan on the suspension: Menunggu pemenuhan syarat, Melanjutkan
 * studi, or Diberhentikan dengan hormat (ayat 8).
 */
export const CONTINUATION_DECISIONS = [
  "pending",
  "continue",
  "dismissed",
] as const;

export type ContinuationDecision = (typeof CONTINUATION_DECISIONS)[number];

/** Bentuk kerja sosial, in the prototype's order; the last is "lainnya". */
export const SOCIAL_WORK_FORMS = [
  "staff_help",
  "traffic",
  "grounds",
  "community",
  "other",
] as const;

export type SocialWorkForm = (typeof SOCIAL_WORK_FORMS)[number];

/** Lokasi kerja sosial, in the prototype's order. */
export const SOCIAL_WORK_PLACES = ["campus", "home_agency", "outside"] as const;

export type SocialWorkPlace = (typeof SOCIAL_WORK_PLACES)[number];

/**
 * What a line of the log of a penalty records: its save, or a change of
 * its status, its ticks of Syarat melanjutkan studi, or its Keputusan.
 */
export const PENALTY_CHANGE_ACTIONS = [
  "added",
  "status_changed",
  "conditions_changed",
  "decision_changed",
] as const;

/** How long Uraian pelanggaran is, without spaces around it. The least is the prototype's. */
export const PENALTY_DESCRIPTION_MIN_LENGTH = 5;
export const PENALTY_DESCRIPTION_MAX_LENGTH = 1000;

/** The most letters Nomor keputusan holds. */
export const DECISION_NUMBER_MAX_LENGTH = 100;

/** The most letters the text of "Bentuk kerja sosial lainnya" holds. */
export const OTHER_SOCIAL_WORK_MAX_LENGTH = 200;

/** How many penalties one page of the list shows. */
export const PENALTIES_PAGE_SIZE = 25;
