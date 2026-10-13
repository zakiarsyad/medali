import {
  OLD_MENTOR_STATUSES,
  REPLACEMENT_REASONS,
  type ReplacementReason,
} from "@/mentoring/replacement-ids";
import { type ShownOldStatus, statusAfterReason } from "./old-mentor-status";

/** What the fields of the form of a replacement hold. */
export interface TypedReplacement {
  reason: ReplacementReason;
  startsOn: string;
  newMentorId: string;
  letterNumber: string;
  oldStatus: ShownOldStatus;
  note: string;
  isConfirmed: boolean;
}

/**
 * What the form starts with: the first reason, today, and nothing else
 * chosen, typed or ticked.
 */
export function startOfReplacement(today: string): TypedReplacement {
  const [reason] = REPLACEMENT_REASONS;
  return {
    reason,
    startsOn: today,
    newMentorId: "",
    letterNumber: "",
    oldStatus: {
      status: statusAfterReason(reason, {
        status: "reserve",
        wasChosen: false,
      }),
      wasChosen: false,
    },
    note: "",
    isConfirmed: false,
  };
}

/**
 * The form after a reason is chosen: "Status pengasuh lama" follows it,
 * see `statusAfterReason`. What names no reason changes nothing.
 */
export function withReason(
  typed: TypedReplacement,
  chosen: string,
): TypedReplacement {
  const reason = REPLACEMENT_REASONS.find((one) => one === chosen);
  if (reason === undefined) return typed;
  const status = statusAfterReason(reason, typed.oldStatus);
  return { ...typed, reason, oldStatus: { ...typed.oldStatus, status } };
}

/**
 * The form after the person chose "Status pengasuh lama" themselves. What
 * names no status changes nothing.
 */
export function withOldStatus(
  typed: TypedReplacement,
  chosen: string,
): TypedReplacement {
  const status = OLD_MENTOR_STATUSES.find((one) => one === chosen);
  if (status === undefined) return typed;
  return { ...typed, oldStatus: { status, wasChosen: true } };
}
