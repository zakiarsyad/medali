import type { ReactNode } from "react";
import type {
  ScheduleKind,
  ScheduleStatus,
} from "@/mental-health/schedule-ids";
import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";
import styles from "./counselling.module.css";
import { KIND_WORDS, SCHEDULE_STATUS_WORDS } from "./schedule-words";

/**
 * The colours of the prototype: waits for Konselor, waits for the
 * student, agreed, and finished, missed or cancelled.
 */
const STATUS_TONES: Record<ScheduleStatus, BadgeTone> = {
  submitted: "warning",
  proposed: "plain",
  scheduled: "good",
  done: "plain",
  missed: "bad",
  cancelled: "plain",
  awaiting: "warning",
  reschedule_asked: "warning",
};

export function ScheduleBadge({ status }: { status: ScheduleStatus }) {
  return (
    <span className={toneBadge(STATUS_TONES[status])}>
      {SCHEDULE_STATUS_WORDS[status]}
    </span>
  );
}

/** The colours of the Jenis in the prototype. */
const KIND_TONES: Record<ScheduleKind, BadgeTone> = {
  voluntary: "good",
  assigned: "bad",
  called: "warning",
};

export function KindBadge({ kind }: { kind: ScheduleKind }) {
  return (
    <span className={toneBadge(KIND_TONES[kind])}>{KIND_WORDS[kind]}</span>
  );
}

/** The mark of a counselling the student did not ask for. */
export function MandatoryBadge() {
  return <span className={toneBadge("bad")}>wajib</span>;
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
