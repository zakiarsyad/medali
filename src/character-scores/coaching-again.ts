import type { Scores } from "./assessment-score";
import { coachingNeedOf } from "./coaching-need";

/**
 * Whether a student's new latest assessment identifies them for coaching
 * again: it lists them, and the one before it, if any, did not. Such a
 * student starts again at Teridentifikasi.
 */
export function isIdentifiedAgain(
  latest: Scores,
  earlier: Scores | null,
): boolean {
  if (coachingNeedOf(latest) === null) return false;
  if (earlier === null) return true;
  return coachingNeedOf(earlier) === null;
}
