/** What a status badge says: all is well, it needs care, something is wrong, or neither. */
export type BadgeTone = "good" | "warning" | "bad" | "plain";

export const BADGE_TONES: readonly BadgeTone[] = [
  "good",
  "warning",
  "bad",
  "plain",
];
