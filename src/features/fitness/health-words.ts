/*
 * How a health note is written on screen. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

import type { ShownCategory } from "./fitness-category";
import { CATEGORY_WORDS } from "./fitness-words";
import type { Illness, NoteCategory, NoteContent } from "./health-ids";

/** Each choice of "Riwayat penyakit", in the prototype's words. */
export const ILLNESS_WORDS: Record<Illness, string> = {
  asthma: "Asma",
  hypertension: "Hipertensi",
  diabetes: "Diabetes melitus",
  heart_disease: "Penyakit jantung",
  gastric_disorder: "Gangguan lambung",
  allergy: "Alergi",
  epilepsy: "Epilepsi",
  bone_joint_injury: "Cedera atau operasi tulang/sendi",
  infectious_disease: "Penyakit menular",
  other: "Lainnya",
};

/** The choice of "Pertimbangan kategori" that follows the fitness test. */
export const FOLLOW_TEST_WORDS = "Ikuti hasil tes kebugaran";

/** Each other choice of "Pertimbangan kategori". */
export const NOTE_CATEGORY_WORDS: Record<NoteCategory, string> = {
  good: CATEGORY_WORDS.good,
  attention: CATEGORY_WORDS.attention,
  medical: CATEGORY_WORDS.medical,
};

/** What the form and the list say for a student with no note. */
export const NO_NOTE_YET = "Belum ada catatan kesehatan.";

/** The mark of a category that a note made more serious than the test. */
export const FROM_NOTE_MARK = "berdasarkan catatan kesehatan";

function smallCategory(category: ShownCategory): string {
  return CATEGORY_WORDS[category].toLowerCase();
}

function historyText(note: NoteContent): string {
  const illnesses = note.illnesses.map(({ illness, note: aside }) => {
    const words = ILLNESS_WORDS[illness];
    return aside === "" ? words : `${words} (${aside})`;
  });
  const parts = [illnesses.join(", "), note.otherHistory].filter(
    (part) => part !== "",
  );
  if (parts.length === 0) return "";
  return `Riwayat: ${parts.join("; ")}.`;
}

/**
 * A note written out as the prototype does: "Riwayat: Asma (sejak SMP),
 * Hipertensi; (riwayat lain). Obat: (obat). (catatan)". What is empty is
 * left out.
 */
export function noteText(note: NoteContent): string {
  const medicine = note.medicine === "" ? "" : `Obat: ${note.medicine}.`;
  return [historyText(note), medicine, note.advice]
    .filter((part) => part !== "")
    .join(" ");
}

/** What "Simpan catatan" says once the note is kept. */
export function savedNoteMessage(
  name: string,
  category: ShownCategory,
): string {
  return `Catatan kesehatan ${name} disimpan. Kategori: ${smallCategory(category)}.`;
}

/** The line beside "Pertimbangan kategori". */
export function categoryHint(
  test: ShownCategory,
  final: ShownCategory,
): string {
  return `Hasil tes: ${smallCategory(test)}. Kategori akhir: ${smallCategory(final)}.`;
}
