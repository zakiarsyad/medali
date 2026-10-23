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
  isHidden,
  oneMoreToHide,
  type SetCountShown,
  shownCount,
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
 * The dorms held back: each where only 1 to 4 residents in reach are in
 * a category, by test or by health note alike, as with so few even "<5"
 * in one category and 0 in the others would tell someone's category.
 * While only one is, the smallest other with a category is held back
 * too, as the bars less the other rows would give that one back.
 */
function heldBackDorms(counts: Record<DormId, CategoryCounts>): Set<DormId> {
  const rows = DORM_IDS.map((dorm) => {
    const counted = inAnyCategory(counts[dorm]);
    const isFew = counted > 0 && counted < FEWEST_COUNTED;
    return { key: dorm, count: counted, hidden: isFew };
  });
  const held = new Set<DormId>();
  for (const row of rows) {
    if (row.hidden) held.add(row.key);
  }
  const extra = oneMoreToHide(rows);
  if (extra !== null) held.add(extra);
  return held;
}

function startingHidden(counts: CategoryCounts, isHeld: boolean): HiddenRow {
  return perCategory(
    (category) => isHeld || shownCount(counts[category]) === "<5",
  );
}

/** Hides one more count of a dorm's row while only one is hidden; says whether it did. */
function hideMoreInRow(counts: CategoryCounts, hidden: HiddenRow): boolean {
  const row = FITNESS_CATEGORIES.map((category) => ({
    key: category,
    count: counts[category],
    hidden: hidden[category],
  }));
  const extra = oneMoreToHide(row);
  if (extra === null) return false;
  hidden[extra] = true;
  return true;
}

/** Hides one more count of a category's column while only one is hidden; says whether it did. */
function hideMoreInColumn(
  counts: Record<DormId, CategoryCounts>,
  hidden: Record<DormId, HiddenRow>,
  category: FitnessCategory,
): boolean {
  const column = DORM_IDS.map((dorm) => ({
    key: dorm,
    count: counts[dorm][category],
    hidden: hidden[dorm][category],
  }));
  const extra = oneMoreToHide(column);
  if (extra === null) return false;
  hidden[extra][category] = true;
  return true;
}

/**
 * Hides counts until no dorm's row and no column has exactly one hidden
 * count. A column counts only while its bar shows a number, as only then
 * does the bar less the column's other counts give one back. Each pass
 * that changes something hides one more count, so it ends.
 */
function hideUntilNoneSingle(
  counts: Record<DormId, CategoryCounts>,
  hidden: Record<DormId, HiddenRow>,
  bars: Record<FitnessCategory, SetCountShown>,
): void {
  const columns = FITNESS_CATEGORIES.filter(
    (category) => !isHidden(bars[category]),
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const dorm of DORM_IDS) {
      if (hideMoreInRow(counts[dorm], hidden[dorm])) changed = true;
    }
    for (const category of columns) {
      if (hideMoreInColumn(counts, hidden, category)) changed = true;
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
  const held = heldBackDorms(counts);
  const hidden = perDorm((dorm) =>
    startingHidden(counts[dorm], held.has(dorm)),
  );
  hideUntilNoneSingle(counts, hidden, bars);
  return perDorm((dorm) =>
    held.has(dorm) ? null : dormCategoriesOf(counts[dorm], hidden[dorm]),
  );
}

/**
 * "Kesehatan jasmani penghuni" from each dorm's tally: the bars of every
 * resident in reach with the rules of the Dashboard, and each dorm's
 * counts only while the bars show counts, each of 1 to 4 as "<5", and
 * none for a dorm held back. A dorm's row and a category's column hide
 * one more count while only one of theirs is hidden. No illness is
 * counted here.
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
