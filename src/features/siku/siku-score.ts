import type { SikuKind } from "./siku-ids";

/** The lowest and the highest SIKU a student can have. */
export const SIKU_MIN = 0;
export const SIKU_MAX = 100;

/** The points a student gained and lost by the entries in force. */
export interface SikuTotals {
  gains: number;
  losses: number;
}

function sumOf(base: number, totals: SikuTotals): number {
  return base + totals.gains - totals.losses;
}

/** SIKU akhir: Nilai dasar plus the gains minus the losses, within 0–100. */
export function sikuOf(base: number, totals: SikuTotals): number {
  return Math.min(SIKU_MAX, Math.max(SIKU_MIN, sumOf(base, totals)));
}

/** Whether the sum fell outside 0–100, so that SIKU akhir was held at an end. */
export function isHeldWithin(base: number, totals: SikuTotals): boolean {
  return sikuOf(base, totals) !== sumOf(base, totals);
}

/** SIKU akhir once one more gain or loss of some points is saved. */
export function sikuAfter(
  base: number,
  totals: SikuTotals,
  kind: SikuKind,
  points: number,
): number {
  if (kind === "gain") {
    return sikuOf(base, { ...totals, gains: totals.gains + points });
  }
  return sikuOf(base, { ...totals, losses: totals.losses + points });
}
