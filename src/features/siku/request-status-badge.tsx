import shared from "@/ui/data-screen.module.css";
import { SHOWN_STATUS_WORDS, type ShownStatus } from "./request-status";
import styles from "./siku.module.css";
import { signedPoints } from "./siku-words";

const LOOKS: Record<ShownStatus, string | undefined> = {
  waiting: styles.waiting,
  approved: styles.approved,
  rejected: styles.rejected,
  cancelled: styles.cancelled,
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
    <span className={`${shared.badge} ${LOOKS[status] ?? ""}`}>
      {words}
      {shownPoints}
    </span>
  );
}
