import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";
import type { LeaveKind, LeaveStatus, ReportStatus } from "./leave-ids";
import { KIND_SHORT_WORDS, STATUS_WORDS } from "./leave-words";
import type { Timeliness } from "./return-rules";
import { REPORT_STATUS_WORDS } from "./return-words";

const STATUS_TONES: Record<LeaveStatus, BadgeTone> = {
  submitted: "warning",
  approved: "good",
  rejected: "bad",
  cancelled: "plain",
  completed: "plain",
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span className={toneBadge(STATUS_TONES[status])}>
      {STATUS_WORDS[status]}
    </span>
  );
}

const REPORT_TONES: Record<ReportStatus, BadgeTone> = {
  waiting: "warning",
  verified: "warning",
  rejected: "bad",
  validated: "good",
};

/** Where a report of a return stands, such as Menunggu verifikasi BAM. */
export function ReportBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={toneBadge(REPORT_TONES[status])}>
      {REPORT_STATUS_WORDS[status]}
    </span>
  );
}

/** Tepat waktu, or Terlambat with the minutes. */
export function TimelinessBadge({ timeliness }: { timeliness: Timeliness }) {
  const tone = timeliness.late ? "bad" : "good";
  return <span className={toneBadge(tone)}>{timeliness.words}</span>;
}

/** In place of Disetujui while the resident is out on the leave. */
export function OutBadge() {
  return <span className={toneBadge("good")}>Di luar asrama</span>;
}

export function LateBadge() {
  return <span className={toneBadge("bad")}>Terlambat</span>;
}

export function KindBadge({ kind }: { kind: LeaveKind }) {
  return <span className={toneBadge("plain")}>{KIND_SHORT_WORDS[kind]}</span>;
}
