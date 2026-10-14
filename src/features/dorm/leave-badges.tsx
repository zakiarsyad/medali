import shared from "@/ui/data-screen.module.css";
import styles from "./leave.module.css";
import type { LeaveKind, LeaveStatus, ReportStatus } from "./leave-ids";
import { KIND_SHORT_WORDS, STATUS_WORDS } from "./leave-words";
import type { Timeliness } from "./return-rules";
import { REPORT_STATUS_WORDS } from "./return-words";

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

const REPORT_STYLES: Record<ReportStatus, string | undefined> = {
  waiting: styles.warn,
  verified: styles.warn,
  rejected: styles.bad,
  validated: styles.ok,
};

/** Where a report of a return stands, such as Menunggu verifikasi BAM. */
export function ReportBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`${shared.badge} ${REPORT_STYLES[status]}`}>
      {REPORT_STATUS_WORDS[status]}
    </span>
  );
}

/** Tepat waktu, or Terlambat with the minutes. */
export function TimelinessBadge({ timeliness }: { timeliness: Timeliness }) {
  const look = timeliness.late ? styles.bad : styles.ok;
  return <span className={`${shared.badge} ${look}`}>{timeliness.words}</span>;
}

/** In place of Disetujui while the resident is out on the leave. */
export function OutBadge() {
  return <span className={`${shared.badge} ${styles.ok}`}>Di luar asrama</span>;
}

export function LateBadge() {
  return <span className={`${shared.badge} ${styles.bad}`}>Terlambat</span>;
}

export function KindBadge({ kind }: { kind: LeaveKind }) {
  return (
    <span className={`${shared.badge} ${styles.plain}`}>
      {KIND_SHORT_WORDS[kind]}
    </span>
  );
}
