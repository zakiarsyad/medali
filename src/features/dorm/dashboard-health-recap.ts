import { DORM_IDS, type DormId } from "@/dorms/dorms";
import {
  FITNESS_CATEGORIES,
  type FitnessCategory,
} from "@/health-notes/fitness-ids";
import {
  type FitnessTally,
  type GroupTally,
  type PhysicalRecap,
  physicalRecapOf,
} from "@/health-notes/fitness-recap";
import type { FinalCategory } from "@/health-notes/health-category";
import { noteText, roomWords } from "@/health-notes/health-words";
import {
  type CountShown,
  FEWEST_COUNTED,
  hiddenCount,
  hideWhilePinned,
  isHidden,
  MOST_UNDER_FIVE,
  oneMoreToHide,
  type SetCountShown,
  type SetEntry,
  shownCount,
  smallestShown,
  totalOf,
} from "@/health-notes/shown-count";
import type { RecapRow } from "@/health-notes/sick-list";
import type { MentalRecap, PublishedRow } from "@/mental-health/mental-recap";

/*
 * The health panels of Dashboard asrama, as they may leave the server.
 * Read by the screen parts, so nothing here may take from the database
 * code.
 */

/** How many residents of one dorm are in each category, as they may show. */
export type DormCategories = Record<FitnessCategory, SetCountShown>;

/** "Kesehatan jasmani penghuni": the bars of every resident in reach, and each dorm's counts. */
export interface DormPhysical {
  recap: PhysicalRecap;
  /**
   * Each dorm's counts, or null while the bars show none. A dorm's own
   * counts are null while it is held back.
   */
  byDorm: Record<DormId, DormCategories | null> | null;
}

/** A resident under "Perlu perhatian dan tindak lanjut medis". */
export interface CareRow {
  id: string;
  name: string;
  /** The room written out, as Kesehatan writes it. */
  room: string;
  final: FinalCategory;
  /** The last note written out, or null with none. */
  note: string | null;
}

/** Of a row of the list of Kesehatan, only what the panel shows. */
export function careRowOf(row: RecapRow): CareRow {
  return {
    id: row.id,
    name: row.name,
    room: roomWords(row.dorm, row.room),
    final: row.final,
    note: row.note === null ? null : noteText(row.note),
  };
}

const NO_CATEGORY = { excellent: 0, good: 0, attention: 0, medical: 0 };

function sumOf(tallies: readonly GroupTally<DormId>[]): FitnessTally {
  const sum: FitnessTally = {
    students: 0,
    tested: 0,
    byCategory: { ...NO_CATEGORY },
  };
  for (const { tally } of tallies) {
    sum.students += tally.students;
    sum.tested += tally.tested;
    sum.byCategory.excellent += tally.byCategory.excellent;
    sum.byCategory.good += tally.byCategory.good;
    sum.byCategory.attention += tally.byCategory.attention;
    sum.byCategory.medical += tally.byCategory.medical;
  }
  return sum;
}

function inAnyCategory(byCategory: FitnessTally["byCategory"]): number {
  return (
    byCategory.excellent +
    byCategory.good +
    byCategory.attention +
    byCategory.medical
  );
}

type CategoryCounts = FitnessTally["byCategory"];

/** Which counts of one dorm's row are hidden. */
type HiddenRow = Record<FitnessCategory, boolean>;

function perDorm<T>(of: (dorm: DormId) => T): Record<DormId, T> {
  return {
    wismantara_putra: of("wismantara_putra"),
    wismantara_putri: of("wismantara_putri"),
    dana_rakca: of("dana_rakca"),
    cipta_bakti: of("cipta_bakti"),
  };
}

function perCategory<T>(
  of: (category: FitnessCategory) => T,
): Record<FitnessCategory, T> {
  return {
    excellent: of("excellent"),
    good: of("good"),
    attention: of("attention"),
    medical: of("medical"),
  };
}

function countsByDorm(
  tallies: readonly GroupTally<DormId>[],
): Record<DormId, CategoryCounts> {
  const found = new Map(tallies.map(({ key, tally }) => [key, tally]));
  return perDorm((dorm) => found.get(dorm)?.byCategory ?? NO_CATEGORY);
}

/**
 * Each dorm's count of residents with a category, hidden while it is
 * held back: each where only 1 to 4 residents in reach are in
 * a category, by test or by health note alike, as with so few even "<5"
 * in one category and 0 in the others would tell someone's category.
 * While those held back are pinned, such as only one, the smallest other
 * with a category is held back too, as the bars less the other rows
 * would give them back.
 */
function heldBackDorms(
  counts: Record<DormId, CategoryCounts>,
): SetEntry<DormId>[] {
  const dorms = DORM_IDS.map((dorm) => {
    const counted = inAnyCategory(counts[dorm]);
    const isFew = counted > 0 && counted < FEWEST_COUNTED;
    return { key: dorm, count: counted, hidden: isFew };
  });
  hideWhilePinned(dorms, totalOf(dorms));
  return dorms;
}

function isHeld(dorms: readonly SetEntry<DormId>[], dorm: DormId): boolean {
  for (const entry of dorms) {
    if (entry.key === dorm) return entry.hidden;
  }
  return false;
}

function startingHidden(counts: CategoryCounts, isHeld: boolean): HiddenRow {
  return perCategory(
    (category) => isHeld || shownCount(counts[category]) === "<5",
  );
}

/** Marks every count of each dorm held back as hidden. */
function hideHeldRows(
  dorms: readonly SetEntry<DormId>[],
  hidden: Record<DormId, HiddenRow>,
): void {
  for (const dorm of dorms) {
    if (dorm.hidden) hidden[dorm.key] = perCategory(() => true);
  }
}

/** Hides one more count of a dorm's row while its hidden counts are pinned; says whether it did. */
function hideMoreInRow(counts: CategoryCounts, hidden: HiddenRow): boolean {
  const row = FITNESS_CATEGORIES.map((category) => ({
    key: category,
    count: counts[category],
    hidden: hidden[category],
  }));
  const extra = oneMoreToHide(row, inAnyCategory(counts));
  if (extra === null) return false;
  hidden[extra] = true;
  return true;
}

function noneHidden(column: readonly SetEntry<DormId>[]): boolean {
  for (const entry of column) {
    if (entry.hidden) return false;
  }
  return true;
}

/**
 * The dorm to hide too in a category's column. While the bar shows a
 * number, the bar is the total, so as in a row. While the bar is hidden,
 * a column with none hidden would give the bar back by adding it up, so
 * one is hidden then.
 */
function oneMoreInColumn(
  column: readonly SetEntry<DormId>[],
  bar: SetCountShown,
): DormId | null {
  if (!isHidden(bar)) return oneMoreToHide(column, bar);
  if (noneHidden(column)) return smallestShown(column);
  return null;
}

/** Hides one more count of a category's column as `oneMoreInColumn` says; says whether it did. */
function hideMoreInColumn(
  counts: Record<DormId, CategoryCounts>,
  hidden: Record<DormId, HiddenRow>,
  category: FitnessCategory,
  bar: SetCountShown,
): boolean {
  const column = DORM_IDS.map((dorm) => ({
    key: dorm,
    count: counts[dorm][category],
    hidden: hidden[dorm][category],
  }));
  const extra = oneMoreInColumn(column, bar);
  if (extra === null) return false;
  hidden[extra][category] = true;
  return true;
}

/**
 * The fewest a category's column could add up to, as far as the screen
 * tells: the counts shown, 1 for each "<5", and none for a dorm held
 * back, as it shows nothing.
 */
function fewestInColumn(
  counts: Record<DormId, CategoryCounts>,
  dorms: readonly SetEntry<DormId>[],
  hidden: Record<DormId, HiddenRow>,
  category: FitnessCategory,
): number {
  let fewest = 0;
  for (const dorm of dorms) {
    if (dorm.hidden) continue;
    const isUnderFive = hidden[dorm.key][category];
    fewest += isUnderFive ? 1 : counts[dorm.key][category];
  }
  return fewest;
}

/**
 * While a column's bar is "<5", so 4 at most, and its dorm counts add up
 * to 4 at their fewest, each is pinned. Then the dorm with a hidden count
 * there and the fewest residents with a category is held back, and the
 * dorms held back are checked again. Says whether it held one back.
 */
function holdBackForColumn(
  counts: Record<DormId, CategoryCounts>,
  dorms: SetEntry<DormId>[],
  hidden: Record<DormId, HiddenRow>,
  category: FitnessCategory,
  bar: SetCountShown,
): boolean {
  if (bar !== "<5") return false;
  const fewest = fewestInColumn(counts, dorms, hidden, category);
  if (fewest < MOST_UNDER_FIVE) return false;
  const canHoldBack = dorms.map((dorm) => ({
    ...dorm,
    hidden: dorm.hidden || !hidden[dorm.key][category],
  }));
  const extra = smallestShown(canHoldBack);
  if (extra === null) return false;
  for (const dorm of dorms) {
    if (dorm.key === extra) dorm.hidden = true;
  }
  hideWhilePinned(dorms, totalOf(dorms));
  hideHeldRows(dorms, hidden);
  return true;
}

/**
 * Hides counts until no dorm's row and no column gives a hidden count
 * back by its sums. Each pass that changes something hides one more
 * count or holds back one more dorm, so it ends.
 */
function hideUntilNonePinned(
  counts: Record<DormId, CategoryCounts>,
  dorms: SetEntry<DormId>[],
  hidden: Record<DormId, HiddenRow>,
  bars: Record<FitnessCategory, SetCountShown>,
): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const dorm of DORM_IDS) {
      if (hideMoreInRow(counts[dorm], hidden[dorm])) changed = true;
    }
    for (const category of FITNESS_CATEGORIES) {
      const bar = bars[category];
      if (holdBackForColumn(counts, dorms, hidden, category, bar)) {
        changed = true;
      }
      if (hideMoreInColumn(counts, hidden, category, bar)) changed = true;
    }
  }
}

function dormCategoriesOf(
  counts: CategoryCounts,
  hidden: HiddenRow,
): DormCategories {
  return perCategory((category) =>
    hidden[category] ? hiddenCount(counts[category]) : counts[category],
  );
}

function byDormOf(
  tallies: readonly GroupTally<DormId>[],
  bars: Record<FitnessCategory, SetCountShown>,
): Record<DormId, DormCategories | null> {
  const counts = countsByDorm(tallies);
  const dorms = heldBackDorms(counts);
  const hidden = perDorm((dorm) =>
    startingHidden(counts[dorm], isHeld(dorms, dorm)),
  );
  hideUntilNonePinned(counts, dorms, hidden, bars);
  return perDorm((dorm) =>
    isHeld(dorms, dorm) ? null : dormCategoriesOf(counts[dorm], hidden[dorm]),
  );
}

/**
 * "Kesehatan jasmani penghuni" from each dorm's tally: the bars of every
 * resident in reach with the rules of the Dashboard, and each dorm's
 * counts only while the bars show counts, each of 1 to 4 as "<5", and
 * none for a dorm held back. A dorm's row and a category's column hide
 * more counts while their sums would give a hidden one back. No illness
 * is counted here.
 */
export function dormPhysicalOf(
  tallies: readonly GroupTally<DormId>[],
): DormPhysical {
  const recap = physicalRecapOf(sumOf(tallies), null);
  if (recap.kind !== "shown") return { recap, byDorm: null };
  return { recap, byDorm: byDormOf(tallies, recap.byCategory) };
}

/** The anonymous count of "Kesehatan mental penghuni", and the sessions of the last 30 days. */
export interface MentalCounts {
  recap: MentalRecap;
  /** "sesi konseling 30 hari terakhir", or null while the levels show none. */
  sessions: CountShown | null;
}

/** A resident whose data a counsellor published to the account, with their room. */
export interface DormPublishedRow extends PublishedRow {
  /** The room written out, as Kesehatan writes it. */
  room: string;
}

/** "Kesehatan mental penghuni" as a whole. */
export interface DormMental extends MentalCounts {
  /** "Data yang dipublikasikan konselor untuk Anda": the newest, at most `PUBLISHED_SHOWN`. */
  published: DormPublishedRow[];
}

/**
 * "Kesehatan mental penghuni" from the anonymous count of the residents
 * in reach and how many sessions they had: the sessions only beside the
 * levels, so they say nothing of a group too small for counts, and 1 to
 * 4 as "<5".
 */
export function dormMentalOf(
  recap: MentalRecap,
  sessions: number,
): MentalCounts {
  if (recap.kind !== "shown") return { recap, sessions: null };
  return { recap, sessions: shownCount(sessions) };
}
