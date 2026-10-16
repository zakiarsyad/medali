/*
 * The note being written in "Catatan kesehatan", before it is sent. Read
 * by the form in the browser, so nothing here may take from the database
 * code.
 */

import { suggestedCategory } from "./health-category";
import {
  type HealthNote,
  ILLNESSES,
  type Illness,
  type NoteCategory,
} from "./health-ids";

export interface NoteDraft {
  /** In the order "Riwayat penyakit" offers them. */
  illnesses: Illness[];
  illnessNotes: Partial<Record<Illness, string>>;
  otherHistory: string;
  medicine: string;
  advice: string;
  /** "Pertimbangan kategori", null for "Ikuti hasil tes kebugaran". */
  category: NoteCategory | null;
  /** Once set by hand, picking illnesses no longer changes the category. */
  categoryTouched: boolean;
}

export const EMPTY_DRAFT: NoteDraft = {
  illnesses: [],
  illnessNotes: {},
  otherHistory: "",
  medicine: "",
  advice: "",
  category: null,
  categoryTouched: false,
};

/**
 * The form of a student just picked: a new note starts from their latest
 * one. A category the latest note chose counts as set by hand.
 */
export function draftFrom(latest: HealthNote | undefined): NoteDraft {
  if (latest === undefined) return EMPTY_DRAFT;
  const illnessNotes: NoteDraft["illnessNotes"] = {};
  for (const { illness, note } of latest.illnesses) {
    illnessNotes[illness] = note;
  }
  return {
    illnesses: latest.illnesses.map((each) => each.illness),
    illnessNotes,
    otherHistory: latest.otherHistory,
    medicine: latest.medicine,
    advice: latest.advice,
    category: latest.category,
    categoryTouched: latest.category !== null,
  };
}

/** Picks or drops an illness; the category follows its suggestion until set by hand. */
export function withIllness(
  draft: NoteDraft,
  illness: Illness,
  picked: boolean,
): NoteDraft {
  const illnesses = ILLNESSES.filter((each) => {
    if (each === illness) return picked;
    return draft.illnesses.includes(each);
  });
  const illnessNotes = { ...draft.illnessNotes };
  if (!picked) delete illnessNotes[illness];
  const category = draft.categoryTouched
    ? draft.category
    : suggestedCategory(illnesses);
  return { ...draft, illnesses, illnessNotes, category };
}

export function withIllnessNote(
  draft: NoteDraft,
  illness: Illness,
  note: string,
): NoteDraft {
  return {
    ...draft,
    illnessNotes: { ...draft.illnessNotes, [illness]: note },
  };
}

/** "Pertimbangan kategori" set by hand. */
export function withCategory(
  draft: NoteDraft,
  category: NoteCategory | null,
): NoteDraft {
  return { ...draft, category, categoryTouched: true };
}
