/*
 * How Asesmen karakter writes its facts. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

import type { AssessmentSource } from "./assessment-ids";

/** "Sumber asesmen", in the prototype's words. */
export const SOURCE_WORDS: Record<AssessmentSource, string> = {
  mentor_observation: "Observasi pengasuh",
  self_assessment: "Penilaian diri",
  peer_assessment: "Penilaian teman sejawat",
  mentor_board_meeting: "Rapat dewan pengasuh",
  medali_instrument: "Instrumen asesmen MEDALI",
};

/** "Sumber asesmen", with the name of the file a row was uploaded in. */
export function shownSource(
  source: AssessmentSource,
  fileName: string | null,
): string {
  if (fileName === null) return SOURCE_WORDS[source];
  return `${SOURCE_WORDS[source]} · Unggah ${fileName}`;
}

/** The note for a role that only reads the tab, in the prototype's words. */
export const READ_ONLY_NOTE =
  "Hasil asesmen MEDALI diinput oleh Penilai Mahasiswa atau Kepala Unit Pembangunan Karakter.";

/** A part of a whole as a whole percent, such as 45%, or 0% of nobody. */
export function shownShare(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}
