import {
  COACHING_NOTE_MAX_LENGTH,
  type CoachingStatus,
  isCoachingStatus,
} from "@/character-scores/coaching-status";
import type { Parsed } from "@/parsed";
import {
  COACHING_NOTE_TOO_LONG,
  NOT_A_COACHING_STATUS,
} from "./coaching-messages";

/*
 * A change of a coaching status as the screen sends it. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** A status with the note of what was done; empty for none. */
export interface CoachingChange {
  status: CoachingStatus;
  note: string;
}

/** The status chosen and the "Catatan" typed, checked; the note trimmed. */
export function parseCoachingChange(
  sentStatus: string,
  sentNote: string,
): Parsed<CoachingChange> {
  if (!isCoachingStatus(sentStatus)) return NOT_A_COACHING_STATUS;
  const note = sentNote.trim();
  if (note.length > COACHING_NOTE_MAX_LENGTH) return COACHING_NOTE_TOO_LONG;
  return { ok: true, value: { status: sentStatus, note } };
}
