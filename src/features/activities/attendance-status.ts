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

/**
 * Whether a schedule still takes a photo from a student whose newest
 * attendance at it has this status, null being nothing sent: with nothing
 * sent, and again after a rejection. A photo that waits is not replaced,
 * and a valid attendance or a dispensation stands.
 */
export function takesNewPhoto(newest: AttendanceStatus | null): boolean {
  return newest === null || newest === "rejected";
}
