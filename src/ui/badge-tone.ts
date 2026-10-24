/**
 * What a status badge says: all is well, it needs care, something is
 * wrong, the heaviest step of a scale, or neither.
 */
export type BadgeTone = "good" | "warning" | "bad" | "severe" | "plain";

export const BADGE_TONES: readonly BadgeTone[] = [
  "good",
  "warning",
  "bad",
  "severe",
  "plain",
];
