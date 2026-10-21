import type { Scores } from "@/character-scores/assessment-score";
import { MEDALI_VALUES } from "@/ui/medali-values";
import {
  PENALTY_CATEGORIES,
  type PenaltyCategory,
  type PenaltyKind,
  rankOf,
} from "./penalty-kinds";

/*
 * The limit a Ringan or Sedang discipline penalty puts on a student's
 * character scores. The stored scores are never changed: the limit is
 * put on them each time they are read. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** The highest nilai karakter, and MEDALI score, under a Ringan or Sedang penalty. */
export const CHARACTER_SCORE_CAP = 70;

/** Whether a penalty of this Kategori limits the scores: Berat does not. */
export function limits(category: PenaltyCategory): boolean {
  return category !== "heavy";
}

/** The Kategori whose penalties limit the scores: Ringan and Sedang. */
export const LIMITING_CATEGORIES: readonly PenaltyCategory[] =
  PENALTY_CATEGORIES.filter(limits);

/**
 * The penalty that limits a student's scores: the highest of their
 * Ringan and Sedang penalties, whatever its status or date. Null when
 * they have none, so their scores count as stored.
 */
export function limitOf(penalties: readonly PenaltyKind[]): PenaltyKind | null {
  let highest: PenaltyKind | null = null;
  for (const penalty of penalties) {
    if (!limits(penalty.category)) continue;
    if (highest === null) {
      highest = penalty;
      continue;
    }
    const isHigher =
      rankOf(penalty.category, penalty.level) >
      rankOf(highest.category, highest.level);
    if (isHigher) highest = penalty;
  }
  if (highest === null) return null;
  return { category: highest.category, level: highest.level };
}

/** A score, or a final nilai karakter, as it counts: at most 70 for a limited student. */
export function limitedScore(score: number, limited: boolean): number {
  if (!limited) return score;
  return Math.min(score, CHARACTER_SCORE_CAP);
}

/**
 * The six MEDALI scores as they count: each at most 70 for a limited
 * student, so the Rerata, the predikat and the medal follow from them.
 */
export function limitedScores(scores: Scores, limited: boolean): Scores {
  if (!limited) return scores;
  const limitedOnes = { ...scores };
  for (const { key } of MEDALI_VALUES) {
    limitedOnes[key] = limitedScore(scores[key], true);
  }
  return limitedOnes;
}
