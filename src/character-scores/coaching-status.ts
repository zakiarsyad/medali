/*
 * The status staff give a student who needs coaching, after each step of
 * it. Read by the screen parts in the browser, so nothing here may take
 * from the database code.
 */

/** Teridentifikasi, Konseling, Pemantauan and Selesai, in the order they follow. */
export const COACHING_STATUSES = [
  "identified",
  "counselling",
  "monitoring",
  "done",
] as const;

export type CoachingStatus = (typeof COACHING_STATUSES)[number];

/** The status of a student with none saved yet. */
export const FIRST_COACHING_STATUS: CoachingStatus = "identified";

export const COACHING_STATUS_WORDS: Record<CoachingStatus, string> = {
  identified: "Teridentifikasi",
  counselling: "Konseling",
  monitoring: "Pemantauan",
  done: "Selesai",
};

/** The longest "Catatan" of what was done, in characters. */
export const COACHING_NOTE_MAX_LENGTH = 300;

export function isCoachingStatus(sent: string): sent is CoachingStatus {
  return (COACHING_STATUSES as readonly string[]).includes(sent);
}
