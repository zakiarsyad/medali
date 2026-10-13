import type { activityAttendanceStatus } from "@/db/schema";

/** Where a stored attendance stands. */
export type AttendanceStatus =
  (typeof activityAttendanceStatus.enumValues)[number];

export const ATTENDANCE_WORDS: Record<AttendanceStatus, string> = {
  waiting: "Menunggu verifikasi",
  valid: "Hadir",
  rejected: "Ditolak",
  dispensation: "Dispensasi",
};
