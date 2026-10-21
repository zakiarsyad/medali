/*
 * How a count of students' health is held back when it is small. Read by
 * the screen parts, so nothing here may take from the database code.
 */

/** The fewest students a health count shows as a number. */
export const FEWEST_COUNTED = 5;

/** A number, or "<5" for one that covers 1 to 4 students. */
export type CountShown = number | "<5";

/** A count as it may show: "<5" for 1 to 4, so a few students are not singled out. */
export function shownCount(count: number): CountShown {
  if (count >= 1 && count < FEWEST_COUNTED) return "<5";
  return count;
}

/** A count as it was sent, written out, such as 1.200 or <5. */
export function countWords(count: CountShown): string {
  if (count === "<5") return count;
  return count.toLocaleString("id-ID");
}
