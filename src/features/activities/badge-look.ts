import type { ClarificationStatus } from "./clarification-reasons";
import type { HistoryStatus } from "./history-status";
import type { ScheduleStatus } from "./schedule-status";

/** How a badge looks: all is well, something waits, something is wrong, or neither. */
export type BadgeLook = "ok" | "warn" | "bad" | "plain";

export const HISTORY_LOOKS: Record<HistoryStatus, BadgeLook> = {
  valid: "ok",
  waiting: "warn",
  rejected: "bad",
  dispensation: "plain",
  absent: "bad",
  not_sent: "warn",
};

export const CLARIFICATION_LOOKS: Record<ClarificationStatus, BadgeLook> = {
  submitted: "warn",
  accepted: "ok",
  rejected: "bad",
};

export const SCHEDULE_LOOKS: Record<ScheduleStatus, BadgeLook> = {
  coming: "plain",
  not_open_yet: "warn",
  open: "ok",
  over: "plain",
};
