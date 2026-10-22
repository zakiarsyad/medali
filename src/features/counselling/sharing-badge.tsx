import type { SharingStatus } from "@/mental-health/sharing-ids";
import { SHARING_STATUS_WORDS } from "@/mental-health/sharing-words";
import shared from "@/ui/data-screen.module.css";
import styles from "./counselling.module.css";

/** The colours of the prototype: waits, given or shown, declined, ended. */
const STATUS_STYLES: Record<SharingStatus, string | undefined> = {
  waiting: styles.warn,
  approved: styles.ok,
  declined: styles.bad,
  published: styles.ok,
  cancelled: styles.plain,
  withdrawn: styles.plain,
};

export function SharingBadge({ status }: { status: SharingStatus }) {
  return (
    <span className={`${shared.badge} ${STATUS_STYLES[status]}`}>
      {SHARING_STATUS_WORDS[status]}
    </span>
  );
}
