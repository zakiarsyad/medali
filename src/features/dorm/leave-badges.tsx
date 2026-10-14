import shared from "@/ui/data-screen.module.css";
import styles from "./leave.module.css";
import type { LeaveKind, LeaveStatus } from "./leave-ids";
import { KIND_SHORT_WORDS, STATUS_WORDS } from "./leave-words";

const STATUS_STYLES: Record<LeaveStatus, string | undefined> = {
  submitted: styles.warn,
  approved: styles.ok,
  rejected: styles.bad,
  cancelled: styles.plain,
  completed: styles.plain,
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span className={`${shared.badge} ${STATUS_STYLES[status]}`}>
      {STATUS_WORDS[status]}
    </span>
  );
}

export function KindBadge({ kind }: { kind: LeaveKind }) {
  return (
    <span className={`${shared.badge} ${styles.plain}`}>
      {KIND_SHORT_WORDS[kind]}
    </span>
  );
}
