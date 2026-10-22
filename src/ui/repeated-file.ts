import { shownDay } from "./day";

/** The words of the confirm a file saved before needs. */
export const SAVE_AGAIN = "Tetap simpan berkas ini lagi";

/** The warning for a file saved before, on the day it was saved. */
export function savedBeforeNote(day: string): string {
  return `Berkas dengan nama dan isi yang sama sudah disimpan pada ${shownDay(day)}.`;
}

/** The warning for a file saved before, with what to do about it. */
export function saveAgainNote(day: string): string {
  return `${savedBeforeNote(day)} Centang "${SAVE_AGAIN}", lalu simpan bila memang perlu.`;
}

/** What a save answers for a file saved before, without the confirm. */
export function repeatedFile(day: string): { ok: false; error: string } {
  return { ok: false, error: saveAgainNote(day) };
}
