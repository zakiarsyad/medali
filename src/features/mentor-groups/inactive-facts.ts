import {
  REPLACEMENT_REASON_TITLES,
  type ReplacementReason,
} from "@/mentoring/replacement-ids";
import {
  INACTIVE_REASON,
  inactiveSince,
  type MentorEnd,
  type MentorStatus,
} from "@/ui/mentor-status";

/** What is read of a mentor to say since when and why they are Tidak aktif. */
export interface ReadMentorEnd extends MentorEnd {
  /** Whether the last replacement that took a group from them set them so. */
  leftAsInactive: boolean;
  /** The start date of that replacement. */
  leftOn: string | null;
  leftFor: ReplacementReason | null;
}

export interface InactiveFacts {
  /** The day since when a Tidak aktif mentor is so, when it is known. */
  inactiveSince: string | null;
  /** Why a Tidak aktif mentor is so. Null for any other mentor. */
  inactiveReason: string | null;
}

const NOT_INACTIVE: InactiveFacts = {
  inactiveSince: null,
  inactiveReason: null,
};

/**
 * Since when and why a mentor is Tidak aktif. One a replacement set so is
 * so since its start date, for its reason, also when the account was
 * removed later. Any other is so since the role was taken or the account
 * removed.
 */
export function inactiveFacts(
  status: MentorStatus,
  end: ReadMentorEnd,
): InactiveFacts {
  if (status !== "inactive") return NOT_INACTIVE;
  if (end.leftAsInactive && end.leftOn !== null && end.leftFor !== null) {
    return {
      inactiveSince: end.leftOn,
      inactiveReason: REPLACEMENT_REASON_TITLES[end.leftFor],
    };
  }
  return { inactiveSince: inactiveSince(end), inactiveReason: INACTIVE_REASON };
}
