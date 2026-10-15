/*
 * How Asesmen karakter writes its facts. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

import type { Predicate } from "@/character-scores/assessment-score";
import type { AssessmentSource } from "./assessment-ids";

/** "Sumber asesmen", in the prototype's words. */
export const SOURCE_WORDS: Record<AssessmentSource, string> = {
  mentor_observation: "Observasi pengasuh",
  self_assessment: "Penilaian diri",
  peer_assessment: "Penilaian teman sejawat",
  mentor_board_meeting: "Rapat dewan pengasuh",
  medali_instrument: "Instrumen asesmen MEDALI",
};

/** The predikat of the Skala predikat MEDALI. */
export const PREDICATE_WORDS: Record<Predicate, string> = {
  gold: "Emas",
  silver: "Perak",
  bronze: "Perunggu",
  guidance: "Perlu pembinaan",
};

/** What a student without any assessment shows. */
export const NOT_ASSESSED = "Belum diasesmen";

/** The note for a role that only reads the tab, in the prototype's words. */
export const READ_ONLY_NOTE =
  "Hasil asesmen MEDALI diinput oleh Penilai Mahasiswa atau Kepala Unit Pembangunan Karakter.";

/** A part of a whole as a whole percent, such as 45%, or 0% of nobody. */
export function shownShare(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}
