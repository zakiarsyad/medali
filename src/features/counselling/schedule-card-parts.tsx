import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./counselling.module.css";
import type { ScheduleStatus } from "./schedule-ids";
import { SCHEDULE_STATUS_WORDS } from "./schedule-words";

/**
 * The colours of the prototype: waits for Konselor, waits for the
 * student, agreed, and finished, missed or cancelled.
 */
const STATUS_STYLES: Record<ScheduleStatus, string | undefined> = {
  submitted: styles.warn,
  proposed: styles.plain,
  scheduled: styles.ok,
  done: styles.plain,
  missed: styles.bad,
  cancelled: styles.plain,
  awaiting: styles.warn,
  reschedule_asked: styles.warn,
};

export function ScheduleBadge({ status }: { status: ScheduleStatus }) {
  return (
    <span className={`${shared.badge} ${STATUS_STYLES[status]}`}>
      {SCHEDULE_STATUS_WORDS[status]}
    </span>
  );
}

/** One fact of a card: its title over it, across the card when wide. */
export function Fact({
  title,
  isWide = false,
  children,
}: {
  title: string;
  isWide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={isWide ? styles.full : undefined}>
      <dt>{title}</dt>
      <dd>{children}</dd>
    </div>
  );
}
