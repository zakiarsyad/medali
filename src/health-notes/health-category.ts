/*
 * How a health note weighs on a student's category. Read by the form in
 * the browser, which shows the category as the note is written, and by
 * the server, so nothing here may take from the database code.
 */

import type { ShownCategory } from "./fitness-category";
import type { FitnessCategory } from "./fitness-ids";
import type { Illness, NoteCategory } from "./health-ids";

/** How serious each category is: the higher, the more serious. */
export const SERIOUSNESS: Record<FitnessCategory, number> = {
  excellent: 0,
  good: 1,
  attention: 2,
  medical: 3,
};

/** A student's category, and whether their health note made it so. */
export interface FinalCategory {
  category: ShownCategory;
  /** "berdasarkan catatan kesehatan": the note is more serious than the test. */
  fromNote: boolean;
}

/**
 * The category of a student: the more serious of their latest test's
 * and their latest note's, or Belum dites with neither. `note` is null
 * when the note follows the fitness test, or there is none.
 */
export function finalCategory(
  test: FitnessCategory | null,
  note: NoteCategory | null,
): FinalCategory {
  if (note === null) return { category: test ?? "untested", fromNote: false };
  if (test === null) return { category: note, fromNote: true };
  if (SERIOUSNESS[note] > SERIOUSNESS[test]) {
    return { category: note, fromNote: true };
  }
  return { category: test, fromNote: false };
}

/** The category each illness suggests. Alergi and Lainnya suggest none. */
const SUGGESTIONS: Partial<Record<Illness, NoteCategory>> = {
  heart_disease: "medical",
  epilepsy: "medical",
  diabetes: "medical",
  infectious_disease: "medical",
  asthma: "attention",
  hypertension: "attention",
  bone_joint_injury: "attention",
  gastric_disorder: "attention",
};

/**
 * What "Pertimbangan kategori" suggests for the illnesses picked: the
 * most serious one they suggest, or null to follow the fitness test.
 */
export function suggestedCategory(
  illnesses: readonly Illness[],
): NoteCategory | null {
  let suggested: NoteCategory | null = null;
  for (const illness of illnesses) {
    const suggestion = SUGGESTIONS[illness];
    if (suggestion === undefined) continue;
    const isMoreSerious =
      suggested === null || SERIOUSNESS[suggestion] > SERIOUSNESS[suggested];
    if (isMoreSerious) suggested = suggestion;
  }
  return suggested;
}
