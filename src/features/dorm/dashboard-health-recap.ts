import type { DormId } from "@/dorms/dorms";
import type { FitnessCategory } from "@/health-notes/fitness-ids";
import {
  type FitnessTally,
  type GroupTally,
  type PhysicalRecap,
  physicalRecapOf,
  shownByCategory,
} from "@/health-notes/fitness-recap";
import type { FinalCategory } from "@/health-notes/health-category";
import { noteText, roomWords } from "@/health-notes/health-words";
import type { CountShown } from "@/health-notes/shown-count";
import type { RecapRow } from "@/health-notes/sick-list";

/*
 * The health panels of Dashboard asrama, as they may leave the server.
 * Read by the screen parts, so nothing here may take from the database
 * code.
 */

/** How many residents of one dorm are in each category, as they may show. */
export type DormCategories = Record<FitnessCategory, CountShown>;

/** "Kesehatan jasmani penghuni": the bars of every resident in reach, and each dorm's counts. */
export interface DormPhysical {
  recap: PhysicalRecap;
  /** Each dorm's counts, or null while the bars show none. */
  byDorm: Record<DormId, DormCategories> | null;
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

function byDormOf(
  tallies: readonly GroupTally<DormId>[],
): Record<DormId, DormCategories> {
  const found = new Map(tallies.map(({ key, tally }) => [key, tally]));
  const of = (dorm: DormId) =>
    shownByCategory(found.get(dorm)?.byCategory ?? NO_CATEGORY);
  return {
    wismantara_putra: of("wismantara_putra"),
    wismantara_putri: of("wismantara_putri"),
    dana_rakca: of("dana_rakca"),
    cipta_bakti: of("cipta_bakti"),
  };
}

/**
 * "Kesehatan jasmani penghuni" from each dorm's tally: the bars of every
 * resident in reach with the rules of the Dashboard, and each dorm's
 * counts only while the bars show counts, each of 1 to 4 as "<5". No
 * illness is counted here.
 */
export function dormPhysicalOf(
  tallies: readonly GroupTally<DormId>[],
): DormPhysical {
  const recap = physicalRecapOf(sumOf(tallies), null);
  if (recap.kind !== "shown") return { recap, byDorm: null };
  return { recap, byDorm: byDormOf(tallies) };
}
