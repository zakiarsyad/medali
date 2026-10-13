import { ATTENDANCE_WORDS, type AttendanceStatus } from "./attendance-status";
import { type UploadRange, uploadDeadline } from "./upload-range";

/**
 * What the history says of one schedule: where the attendance stands, or
 * with nothing sent, that the student was absent or may still send.
 */
export type HistoryStatus = AttendanceStatus | "absent" | "not_sent";

export const HISTORY_WORDS: Record<HistoryStatus, string> = {
  ...ATTENDANCE_WORDS,
  absent: "Tidak hadir",
  not_sent: "Belum unggah",
};

/**
 * The status of a schedule in the history of a student on a day on
 * campus. With nothing sent they are absent once the upload time has
 * closed; until the end of the last upload day they may still send.
 */
export function historyStatus(
  attendance: AttendanceStatus | null,
  schedule: UploadRange,
  today: string,
): HistoryStatus {
  if (attendance !== null) return attendance;
  return today > uploadDeadline(schedule) ? "absent" : "not_sent";
}
