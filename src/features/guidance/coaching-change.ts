import {
  COACHING_NOTE_MAX_LENGTH,
  type CoachingStatus,
  isCoachingStatus,
} from "@/character-scores/coaching-status";
import type { Parsed } from "@/parsed";
import {
  COACHING_NOTE_TOO_LONG,
  type COACHING_OUTDATED,
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

/** A student's status as the screen shows it, with the version it was read at. */
export interface ShownCoachingStatus extends CoachingChange {
  /** 0 while no status is saved. */
  version: number;
}

/** A student's status as it stands after a change, with whose it is. */
export interface KeptCoachingStatus extends ShownCoachingStatus {
  name: string;
}

/** A change refused as someone changed the status first, with the status now. */
export type OutdatedCoaching = typeof COACHING_OUTDATED & {
  current: ShownCoachingStatus;
};

export type CoachingOutcome = Parsed<KeptCoachingStatus> | OutdatedCoaching;

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
