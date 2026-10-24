import type { SharingStatus } from "@/mental-health/sharing-ids";
import { SHARING_STATUS_WORDS } from "@/mental-health/sharing-words";
import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";

/** The colours of the prototype: waits, given or shown, declined, ended. */
const STATUS_TONES: Record<SharingStatus, BadgeTone> = {
  waiting: "warning",
  approved: "good",
  declined: "bad",
  published: "good",
  cancelled: "plain",
  withdrawn: "plain",
};

export function SharingBadge({ status }: { status: SharingStatus }) {
  return (
    <span className={toneBadge(STATUS_TONES[status])}>
      {SHARING_STATUS_WORDS[status]}
    </span>
  );
}
