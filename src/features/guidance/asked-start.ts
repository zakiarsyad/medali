import type { PenaltyStart } from "./penalty-student";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** What the form does when its address changes. */
export interface StartChange {
  /** The start to take now, or null to keep what the form holds. */
  take: PenaltyStart | null;
  /** The student to remember as the last one taken; null for none. */
  remember: string | null;
}

/**
 * What the form does with its start. It takes a student only when the
 * address asks for one other than the last it took, as "Catat
 * pelanggaran" pressed in a detail over the tab does, so a save that
 * leaves the address on the same student does not pick them again. An
 * address without a student, after a name, a filter, a page or Tutup,
 * keeps the pick and all that was typed, and forgets the last student,
 * so asking for that one anew picks them again.
 */
export function startChange(
  start: PenaltyStart | null,
  lastTaken: string | null,
): StartChange {
  if (start === null) return { take: null, remember: null };
  if (start.pick.id === lastTaken) return { take: null, remember: lastTaken };
  return { take: start, remember: start.pick.id };
}
