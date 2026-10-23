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

/**
 * The fewest a hidden count could be, as far as the screen tells: 1 for
 * "<5" and 5 for "5+". A count of 0 is hidden only in a dorm row held
 * back, where it shows nothing, so it could be 0.
 */
function fewestHidden(count: number): number {
  if (count === 0) return 0;
  if (count < FEWEST_COUNTED) return 1;
  return FEWEST_COUNTED;
}

/** The most a hidden "<5" could be. */
export const MOST_UNDER_FIVE = FEWEST_COUNTED - 1;

/**
 * Whether the hidden counts of a set can be worked out from its total
 * and the counts shown: one alone is the total less the others, and
 * several are each pinned while their sum is the fewest they could add
 * up to or, all "<5", the most.
 */
export function hiddenArePinned<Key extends string>(
  set: readonly SetEntry<Key>[],
  total: number,
): boolean {
  let hidden = 0;
  let hiddenSum = total;
  let fewest = 0;
  let allUnderFive = true;
  for (const entry of set) {
    if (!entry.hidden) {
      hiddenSum -= entry.count;
      continue;
    }
    hidden += 1;
    fewest += fewestHidden(entry.count);
    if (entry.count >= FEWEST_COUNTED) allUnderFive = false;
  }
  if (hidden === 0) return false;
  if (hidden === 1) return true;
  if (hiddenSum === fewest) return true;
  return allUnderFive && hiddenSum === hidden * MOST_UNDER_FIVE;
}

/** The smallest count above 0 still shown, the first on a tie, or null with none. */
export function smallestShown<Key extends string>(
  set: readonly SetEntry<Key>[],
): Key | null {
  let smallest: SetEntry<Key> | null = null;
  for (const entry of set) {
    const canHide = !entry.hidden && entry.count > 0;
    if (!canHide) continue;
    if (smallest === null || entry.count < smallest.count) smallest = entry;
  }
  return smallest === null ? null : smallest.key;
}

/**
 * The count to hide too while the hidden counts of a set are pinned:
 * the smallest above 0 still shown. Null when none is to be.
 */
export function oneMoreToHide<Key extends string>(
  set: readonly SetEntry<Key>[],
  total: number,
): Key | null {
  if (!hiddenArePinned(set, total)) return null;
  return smallestShown(set);
}

/** Hides one more count of a set while its hidden counts are pinned, until they are not. */
export function hideWhilePinned<Key extends string>(
  set: SetEntry<Key>[],
  total: number,
): void {
  let extra = oneMoreToHide(set, total);
  while (extra !== null) {
    for (const entry of set) {
      if (entry.key === extra) entry.hidden = true;
    }
    extra = oneMoreToHide(set, total);
  }
}

export function totalOf<Key extends string>(
  set: readonly SetEntry<Key>[],
): number {
  let total = 0;
  for (const entry of set) total += entry.count;
  return total;
}

/**
 * The counts of one set as they may show, `order` being the order of
 * the screen: each of 1 to 4 as "<5", and more hidden while the hidden
 * ones are pinned, so no count can be worked out from the total and the
 * others.
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
  hideWhilePinned(set, totalOf(set));
  const shown: Record<Key, SetCountShown> = { ...counts };
  for (const entry of set) {
    shown[entry.key] = entry.hidden ? hiddenCount(entry.count) : entry.count;
  }
  return shown;
}
