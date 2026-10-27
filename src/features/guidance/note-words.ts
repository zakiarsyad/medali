import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { periodTitle } from "@/academic-periods/period-labels";
import type { NoteCategory, NotePunishment } from "./violation-note-ids";

/*
 * The words of Catatan pelanggaran. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

export const NOTES_LEDE =
  "Catatan pelanggaran sebelum dijatuhi hukuman disiplin ringan. Berlaku satu semester.";

/** What an account that only reads is told instead of the form. */
export const WHO_WRITES =
  "Catatan pelanggaran diisi oleh Pembina Disiplin Mahasiswa dan Kepala Unit Pembangunan Karakter.";

export const NO_NOTES_FOUND = "Tidak ada catatan pelanggaran pada filter ini.";
export const NO_NOTES = "Belum ada catatan pelanggaran.";
export const NO_NOTES_THIS_SEMESTER =
  "Belum ada catatan pelanggaran pada semester ini.";

export const NOT_IN_FORCE = "Tidak berlaku";

/** What one row of the list is, as the pager says it. */
export const NOTE_NOUN = "catatan";

export const PUNISHMENT_WORDS: Record<NotePunishment, string> = {
  direct_guidance: "Pembinaan langsung",
  warning: "Teguran",
  other: "Hukuman lainnya",
};

export const CATEGORY_WORDS: Record<NoteCategory, string> = {
  first: "Pelanggaran pertama",
  further: "Pelanggaran lanjutan",
};

/** The punishment as the list shows it: what Hukuman lainnya is, when written. */
export function punishmentText(
  punishment: NotePunishment,
  otherPunishment: string,
): string {
  if (punishment === "other" && otherPunishment !== "") return otherPunishment;
  return PUNISHMENT_WORDS[punishment];
}

/** The running semester as the screen names it, or a dash while none runs. */
export function semesterWords(period: AcademicPeriod | null): string {
  return period === null ? "-" : periodTitle(period);
}
