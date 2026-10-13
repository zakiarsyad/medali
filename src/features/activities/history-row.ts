import {
  type ClarificationCell,
  clarificationCell,
  type ShownClarification,
} from "./clarification-time";
import { type HistoryStatus, historyStatus } from "./history-status";
import { shownDays } from "./schedule-words";
import { lastUploadDay } from "./student-activity-words";
import type { StudentSchedule } from "./student-schedule";

/*
 * Read by the history in the browser, so nothing here may take from the
 * database code.
 */

/** One schedule of "Riwayat kehadiran", with every word its row shows. */
export interface HistoryRow {
  /** The key of the schedule. */
  id: string;
  /** Its days, such as 13 Okt 2026. */
  days: string;
  name: string;
  isRequired: boolean;
  status: HistoryStatus;
  /** The last upload day, while a photo may still be sent; null otherwise. */
  uploadUntil: string | null;
  /** What the row shows as Keterangan. Empty when nothing was noted. */
  note: string;
  clarification: ClarificationCell;
}

/**
 * The row of a schedule in the history of a student on a day on campus.
 * `newest` is their newest clarification for it, or null with none sent.
 */
export function historyRowOf(
  schedule: StudentSchedule,
  today: string,
  newest: ShownClarification | null,
): HistoryRow {
  const attendance = schedule.attendance?.status ?? null;
  const status = historyStatus(attendance, schedule, today);
  return {
    id: schedule.id,
    days: shownDays(schedule.startsOn, schedule.endsOn),
    name: schedule.name,
    isRequired: schedule.isRequired,
    status,
    uploadUntil: status === "not_sent" ? lastUploadDay(schedule) : null,
    note: schedule.attendance?.note ?? "",
    clarification: clarificationCell({ attendance, schedule, today, newest }),
  };
}
