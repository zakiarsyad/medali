import type { BadgeTone } from "@/ui/badge-tone";
import type { ClarificationStatus } from "./clarification-reasons";
import type { HistoryStatus } from "./history-status";
import type { ScheduleStatus } from "./schedule-status";

export const HISTORY_LOOKS: Record<HistoryStatus, BadgeTone> = {
  valid: "good",
  waiting: "warning",
  rejected: "bad",
  dispensation: "plain",
  absent: "bad",
  not_sent: "warning",
};

export const CLARIFICATION_LOOKS: Record<ClarificationStatus, BadgeTone> = {
  submitted: "warning",
  accepted: "good",
  rejected: "bad",
};

export const SCHEDULE_LOOKS: Record<ScheduleStatus, BadgeTone> = {
  coming: "plain",
  not_open_yet: "warning",
  open: "good",
  over: "plain",
};
