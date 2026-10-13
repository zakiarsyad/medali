/** The numbers above the scores of one group. */
export interface ScoresOverview {
  /** "Sudah dinilai pengasuh": the members who have a saved score. */
  scored: number;
  /** The members who have none yet. */
  left: number;
  /** "Rerata nilai pengasuhan", or null while no member has a score. */
  average: number | null;
}

/**
 * The numbers of a group, from the saved score of each of its members,
 * null for a member without one. The average is of the saved scores
 * alone: a member without a score counts for nothing in it.
 */
export function scoresOverview(
  scores: readonly (number | null)[],
): ScoresOverview {
  let scored = 0;
  let sum = 0;
  for (const score of scores) {
    if (score === null) continue;
    scored += 1;
    sum += score;
  }
  return {
    scored,
    left: scores.length - scored,
    average: scored === 0 ? null : sum / scored,
  };
}

/** The average as its card shows it: one decimal, or a dash for none. */
export function shownScoreAverage(average: number | null): string {
  if (average === null) return "-";
  return average.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** The line under "Sudah dinilai pengasuh": how many members are left. */
export function leftWords(overview: ScoresOverview): string {
  if (overview.scored + overview.left === 0) return "belum ada anak asuh aktif";
  if (overview.left === 0) return "lengkap";
  return `${overview.left} belum diinput`;
}
