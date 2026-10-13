import { daysAfter } from "@/academic-periods/days-after";
import type { AttendanceStatus } from "./attendance-status";
import type { ClarificationStatus } from "./clarification-reasons";
import { historyStatus } from "./history-status";
import { type UploadRange, uploadDeadline } from "./upload-range";

/*
 * Read by the student's history in the browser, so nothing here may take
 * from the database code.
 */

/** How many days after the last upload day a clarification can be sent. */
export const CLARIFICATION_DAYS = 7;

/**
 * The last day a clarification can be sent for a schedule: the seventh
 * day after the last day a photo may be uploaded.
 */
export function clarificationDeadline(range: UploadRange): string {
  return daysAfter(uploadDeadline(range), CLARIFICATION_DAYS);
}

/**
 * Whether the clarification time of a schedule is open on a day on
 * campus: up to the end of its last day. It has no first day of its own:
 * whether there is something to clarify is told from the attendance.
 */
export function clarificationTimeOpen(
  range: UploadRange,
  today: string,
): boolean {
  return today <= clarificationDeadline(range);
}

/**
 * Whether an attendance is one a student may ask a clarification for:
 * their newest photo was rejected, or they sent nothing and the upload
 * time has closed. `attendance` is the status of their newest attendance
 * at the schedule, null being nothing sent.
 */
export function mayBeClarified(
  attendance: AttendanceStatus | null,
  range: UploadRange,
  today: string,
): boolean {
  const status = historyStatus(attendance, range, today);
  return status === "absent" || status === "rejected";
}

/** The newest clarification of a student for a schedule, as far as their row shows it. */
export interface ShownClarification {
  status: ClarificationStatus;
  /** What Penilai Mahasiswa noted. Empty when nothing was noted. */
  note: string;
}

/** What can be done or read in the Klarifikasi cell of a row. */
export type ClarificationAction = "ask" | "ask_again" | "closed";

/** What the Klarifikasi cell of a row of the history shows. */
export interface ClarificationCell {
  /** The status of the newest clarification, or null when none was sent. */
  badge: ClarificationStatus | null;
  /** The note of a rejection, or empty. */
  note: string;
  action: ClarificationAction | null;
}

export const CLARIFICATION_BADGE_WORDS: Record<ClarificationStatus, string> = {
  submitted: "Klarifikasi diajukan",
  accepted: "Klarifikasi diterima",
  rejected: "Klarifikasi ditolak",
};

export const CLARIFICATION_ACTION_WORDS: Record<ClarificationAction, string> = {
  ask: "Ajukan klarifikasi",
  ask_again: "Ajukan ulang",
  closed: "Batas klarifikasi lewat",
};

/**
 * What the Klarifikasi cell of one schedule shows a student on a day on
 * campus. With a clarification sent, its status, and after a rejection
 * its note and a second try while the attendance may still be clarified
 * and the time is open. With none sent, the first try where the
 * attendance may be clarified, or that the time is over.
 */
export function clarificationCell(parts: {
  attendance: AttendanceStatus | null;
  schedule: UploadRange;
  today: string;
  newest: ShownClarification | null;
}): ClarificationCell {
  const { attendance, schedule, today, newest } = parts;
  const mayAsk = mayBeClarified(attendance, schedule, today);
  const isOpen = clarificationTimeOpen(schedule, today);
  if (newest === null) {
    if (!mayAsk) return { badge: null, note: "", action: null };
    return { badge: null, note: "", action: isOpen ? "ask" : "closed" };
  }
  if (newest.status !== "rejected") {
    return { badge: newest.status, note: "", action: null };
  }
  const mayAskAgain = mayAsk && isOpen;
  return {
    badge: "rejected",
    note: newest.note,
    action: mayAskAgain ? "ask_again" : null,
  };
}

/** Whether a cell lets the student send a clarification. */
export function takesClarification(cell: ClarificationCell): boolean {
  return cell.action === "ask" || cell.action === "ask_again";
}
