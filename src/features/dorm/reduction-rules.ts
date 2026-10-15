import { lettersIn } from "@/ui/letters-in";
import type { AppealStatus } from "./appeal-ids";
import {
  REDUCTION_REASON_MAX_LENGTH,
  REDUCTION_REASON_MIN_LENGTH,
} from "./violation-ids";
import { violationStatus } from "./violation-status";

/*
 * The rules of a reduction of a dorm violation, apart from the database.
 * Read by the forms in the browser, so nothing here may take from the
 * database code.
 */

export const REDUCTION_REASON_TOO_SHORT = `Dasar pengurangan minimal ${REDUCTION_REASON_MIN_LENGTH} karakter.`;
export const REDUCTION_REASON_TOO_LONG = `Dasar pengurangan paling banyak ${REDUCTION_REASON_MAX_LENGTH} karakter.`;

/** The database keeps no text with this character; only a hand-made form sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

/** Dasar pengurangan as it is kept: without spaces around it. */
export function keptReductionReason(sent: string): string {
  return sent.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
}

/** What is wrong with Dasar pengurangan, in words, or null. */
export function reductionReasonFault(sent: string): string | null {
  const letters = lettersIn(keptReductionReason(sent));
  if (letters < REDUCTION_REASON_MIN_LENGTH) return REDUCTION_REASON_TOO_SHORT;
  if (letters > REDUCTION_REASON_MAX_LENGTH) return REDUCTION_REASON_TOO_LONG;
  return null;
}

/** What a violation is to a reduction, at a moment. */
export interface ReducedViolation {
  announcedAt: Date;
  cancelledAt: Date | null;
  reducedAt: Date | null;
  appeal: AppealStatus | null;
}

/**
 * Whether a violation may be reduced at a moment: only once it went up
 * to Pengelola Asrama, so not while it waits for its announcement, in
 * Masa advokasi, with its appeal waiting or accepted, nor once
 * cancelled; and only once.
 */
export type ReductionStanding = "reducible" | "reduced" | "not_escalated";

export function reductionStanding(
  violation: ReducedViolation,
  now: Date,
): ReductionStanding {
  if (violation.reducedAt !== null) return "reduced";
  if (violation.cancelledAt !== null) return "not_escalated";
  const status = violationStatus(violation.announcedAt, violation.appeal, now);
  if (status === "escalated") return "reducible";
  return "not_escalated";
}
