import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";
import { SHOWN_STATUS_WORDS, type ShownStatus } from "./request-status";
import { signedPoints } from "./siku-words";

const TONES: Record<ShownStatus, BadgeTone> = {
  waiting: "warning",
  approved: "good",
  rejected: "bad",
  cancelled: "plain",
};

/** Where a request stands, with the points of an approval in force. */
export function RequestStatusBadge({
  status,
  points,
}: {
  status: ShownStatus;
  points: number | null;
}) {
  const words = SHOWN_STATUS_WORDS[status];
  const shownPoints =
    status === "approved" && points !== null
      ? ` ${signedPoints(points, "gain")}`
      : "";
  return (
    <span className={toneBadge(TONES[status])}>
      {words}
      {shownPoints}
    </span>
  );
}
