/*
 * How a count of students' health is held back when it is small. Read by
 * the screen parts, so nothing here may take from the database code.
 */

/** The fewest students a health count shows as a number. */
export const FEWEST_COUNTED = 5;

/** A number, or "<5" for one that covers 1 to 4 students. */
export type CountShown = number | "<5";

/** A count hidden from the screen: "<5" for 1 to 4, "5+" for 5 or more. */
export type HiddenCount = "<5" | "5+";

/** A count of a set, such as the fitness categories, as it may show. */
export type SetCountShown = number | HiddenCount;

/** A count as it may show: "<5" for 1 to 4, so a few students are not singled out. */
export function shownCount(count: number): CountShown {
  if (count >= 1 && count < FEWEST_COUNTED) return "<5";
  return count;
}

/** A count hidden from the screen, written so it stays true. */
export function hiddenCount(count: number): HiddenCount {
  if (count < FEWEST_COUNTED) return "<5";
  return "5+";
}

export function isHidden(count: SetCountShown): count is HiddenCount {
  return count === "<5" || count === "5+";
}

/** A count as it was sent, written out, such as 1.200, <5 or 5+. */
export function countWords(count: SetCountShown): string {
  if (isHidden(count)) return count;
  return count.toLocaleString("id-ID");
}

/** One count of a set, in the order the screen shows the set. */
export interface SetEntry<Key extends string> {
  key: Key;
  count: number;
  hidden: boolean;
}

function hiddenIn<Key extends string>(set: readonly SetEntry<Key>[]): number {
  let hidden = 0;
  for (const entry of set) {
    if (entry.hidden) hidden += 1;
  }
  return hidden;
}

/**
 * The count to hide too while exactly one count of a set is hidden, as
 * the total less the others would give that one back: the smallest
 * above 0 still shown, the first on a tie. Null when none is to be.
 */
export function oneMoreToHide<Key extends string>(
  set: readonly SetEntry<Key>[],
): Key | null {
  if (hiddenIn(set) !== 1) return null;
  let smallest: SetEntry<Key> | null = null;
  for (const entry of set) {
    const canHide = !entry.hidden && entry.count > 0;
    if (!canHide) continue;
    if (smallest === null || entry.count < smallest.count) smallest = entry;
  }
  return smallest === null ? null : smallest.key;
}

/**
 * The counts of one set as they may show, `order` being the order of
 * the screen: each of 1 to 4 as "<5", and while only one is, the
 * smallest other above 0 hidden too, so no count can be worked out from
 * the total and the others.
 */
export function shownSet<Key extends string>(
  order: readonly Key[],
  counts: Record<Key, number>,
): Record<Key, SetCountShown> {
  const set = order.map((key) => ({
    key,
    count: counts[key],
    hidden: shownCount(counts[key]) === "<5",
  }));
  const extra = oneMoreToHide(set);
  const shown: Record<Key, SetCountShown> = { ...counts };
  for (const key of order) {
    shown[key] =
      key === extra ? hiddenCount(counts[key]) : shownCount(counts[key]);
  }
  return shown;
}
