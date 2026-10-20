/*
 * The numbers of the residents' health for a role that sees numbers
 * only, held back where they could tell who is ill. Read by the screen
 * parts, so nothing here may take from the database code.
 */

import type { RecapNumbers } from "@/health-notes/sick-list";

/** The fewest residents in reach for any number to show. */
export const FEWEST_COUNTED = 5;

/** A number, or "<5" for one that covers 1 to 4 residents. */
export type CountShown = number | "<5";

export type HealthCounts =
  | { kind: "too_few" }
  | {
      kind: "shown";
      residents: number;
      listed: CountShown;
      attention: CountShown;
      medical: CountShown;
      medicalWithoutNote: CountShown;
      /** The share of the listed among the residents, or null while it is "<5". */
      listedShare: number | null;
    };

/** A count as it may show: "<5" for 1 to 4, so a few residents are not singled out. */
export function shownCount(count: number): CountShown {
  if (count >= 1 && count < FEWEST_COUNTED) return "<5";
  return count;
}

/**
 * The numbers as a numbers-only role sees them: none at all below 5
 * residents in reach, and "<5" for any number of 1 to 4. A share is
 * left out when its number is, as it would give the number back.
 */
export function healthCounts(numbers: RecapNumbers): HealthCounts {
  if (numbers.students < FEWEST_COUNTED) return { kind: "too_few" };
  const listed = shownCount(numbers.listed);
  const listedShare =
    listed === "<5"
      ? null
      : Math.round((numbers.listed / numbers.students) * 100);
  return {
    kind: "shown",
    residents: numbers.students,
    listed,
    attention: shownCount(numbers.attention),
    medical: shownCount(numbers.medical),
    medicalWithoutNote: shownCount(numbers.medicalWithoutNote),
    listedShare,
  };
}
