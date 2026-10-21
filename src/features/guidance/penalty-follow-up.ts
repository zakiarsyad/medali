import type { Parsed } from "@/parsed";
import type { FormState } from "@/ui/form-message";
import type {
  ContinuationCondition,
  ContinuationDecision,
  PenaltyStatus,
} from "./penalty-ids";
import { STATUS_IS_SET } from "./penalty-messages";

/*
 * The rules of following up a discipline penalty. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

/** The statuses a follow-up chooses from; Ditetapkan is never one. */
export const FOLLOW_UP_STATUSES = ["imposed", "serving", "served"] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

/** What a follow-up changes of a penalty. */
export interface FollowUpValues {
  status: PenaltyStatus;
  conditionsMet: ContinuationCondition[];
  decision: ContinuationDecision;
}

/** The follow-up of a penalty as it is kept, with its version. */
export interface PenaltyFollowUp extends FollowUpValues {
  version: number;
}

/** What a follow-up tells the row it was made from. */
export interface FollowUpState extends FormState {
  /** The penalty as it is now; null when nothing was read. */
  followUp: PenaltyFollowUp | null;
  /** "Kerja sosial belum selesai" now; null when it did not change. */
  unfinishedWork: number | null;
}

export function isFollowUpStatus(sent: string): sent is FollowUpStatus {
  return (FOLLOW_UP_STATUSES as readonly string[]).includes(sent);
}

/**
 * The follow-up with another status. A Ditetapkan penalty ends the
 * student's status for good, so it never changes. The status may go
 * back, such as from Selesai dijalani to Sedang dijalani: the log keeps
 * the trail.
 */
export function withStatus(
  before: FollowUpValues,
  status: FollowUpStatus,
): Parsed<FollowUpValues> {
  if (before.status === "set") return STATUS_IS_SET;
  return { ok: true, value: { ...before, status } };
}
