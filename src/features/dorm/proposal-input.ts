import type { Parsed } from "@/parsed";
import { lettersIn } from "@/ui/letters-in";
import {
  HANDLING_NOTE_MAX_LENGTH,
  HANDLING_NOTE_MIN_LENGTH,
} from "./warning-ids";
import { keptText } from "./warning-input";

/*
 * The rule of what Kepala Unit writes to handle a discipline proposal,
 * apart from the database. Read by the form in the browser, so nothing
 * here may take from the database code.
 */

export const HANDLING_NOTE_NEEDED =
  "Isi catatan tindak lanjut sebelum menandai pengajuan diproses.";
export const HANDLING_NOTE_LENGTH = `Catatan tindak lanjut ${HANDLING_NOTE_MIN_LENGTH} sampai ${HANDLING_NOTE_MAX_LENGTH.toLocaleString("id-ID")} karakter.`;

/**
 * "Catatan tindak lanjut" as it is kept. Nothing sent is trusted: it is
 * needed, 5 to 1,000 letters without spaces around it.
 */
export function parseHandlingNote(sent: unknown): Parsed<string> {
  const note = keptText(sent);
  if (note === "") return { ok: false, error: HANDLING_NOTE_NEEDED };
  const letters = lettersIn(note);
  if (
    letters < HANDLING_NOTE_MIN_LENGTH ||
    letters > HANDLING_NOTE_MAX_LENGTH
  ) {
    return { ok: false, error: HANDLING_NOTE_LENGTH };
  }
  return { ok: true, value: note };
}
