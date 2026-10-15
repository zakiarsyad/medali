import { lettersIn } from "@/ui/letters-in";
import {
  APPEAL_REASON_MAX_LENGTH,
  APPEAL_REASON_MIN_LENGTH,
} from "./appeal-ids";
import { violationStatus } from "./violation-status";

/*
 * The rules of an appeal of a dorm violation, apart from the database.
 * Read by the form in the browser, so nothing here may take from the
 * database code.
 */

export const REASON_TOO_SHORT = `Alasan advokasi minimal ${APPEAL_REASON_MIN_LENGTH} karakter.`;
export const REASON_TOO_LONG = `Alasan advokasi paling banyak ${APPEAL_REASON_MAX_LENGTH} karakter.`;

/**
 * Whether a violation may be appealed at a moment: only once it is
 * announced, within its appeal time, and only once.
 */
export type AppealStanding = "open" | "not_announced" | "over" | "appealed";

export function appealStanding(
  announcedAt: Date,
  hasAppeal: boolean,
  now: Date,
): AppealStanding {
  if (hasAppeal) return "appealed";
  const status = violationStatus(announcedAt, null, now);
  if (status === "scheduled") return "not_announced";
  if (status === "appeal") return "open";
  return "over";
}

/** The database keeps no text with this character; only a hand-made form sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

/** Alasan advokasi as it is kept: without spaces around it. */
export function keptReason(sent: string): string {
  return sent.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
}

/** What is wrong with Alasan advokasi, in words, or null. */
export function reasonFault(sent: string): string | null {
  const letters = lettersIn(keptReason(sent));
  if (letters < APPEAL_REASON_MIN_LENGTH) return REASON_TOO_SHORT;
  if (letters > APPEAL_REASON_MAX_LENGTH) return REASON_TOO_LONG;
  return null;
}
