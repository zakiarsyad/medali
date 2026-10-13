import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import { type ScheduleStatus, STATUS_WORDS } from "./schedule-status";

const STATUS_STYLES: Record<ScheduleStatus, string | undefined> = {
  coming: styles.plain,
  not_open_yet: styles.waiting,
  open: styles.open,
  over: styles.plain,
};

/** The status of a schedule, in the look of how far it is. */
export function StatusBadge({ status }: { status: ScheduleStatus }) {
  return (
    <span className={`${shared.badge} ${STATUS_STYLES[status]}`}>
      {STATUS_WORDS[status]}
    </span>
  );
}
