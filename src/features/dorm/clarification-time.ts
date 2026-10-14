import { daysAfter } from "@/academic-periods/days-after";
import {
  type DormClarificationStatus,
  WAITING_STATUSES,
} from "./clarification-ids";
import type { HistoryEntry, HistoryStatus } from "./history";

/*
 * When a resident may clarify a dorm absence, and what the Klarifikasi
 * cell of Riwayat shows. Read by the screen parts in the browser, so
 * nothing here may take from the database code.
 */

/**
 * How many days after the activity a clarification can be sent: the
 * prototype's value, to be confirmed by the campus before launch.
 */
export const CLARIFICATION_DAYS = 7;

/** The last day a clarification of an activity on `day` can be sent. */
export function clarificationDeadline(day: string): string {
  return daysAfter(day, CLARIFICATION_DAYS);
}

/**
 * Whether a clarification of an activity on `day` can still be sent on
 * `today` on campus: up to the end of the seventh day after it.
 */
export function clarificationOpen(day: string, today: string): boolean {
  return today <= clarificationDeadline(day);
}

/** The first day whose activities may still be clarified on `today`. */
export function firstClarifiableDay(today: string): string {
  return daysAfter(today, -CLARIFICATION_DAYS);
}

/** The newest clarification of a resident for an activity, as their row shows it. */
export interface ShownClarification {
  id: string;
  status: DormClarificationStatus;
  /** The note of a rejection or a closing; empty for any other. */
  note: string;
  /** Null when no file of it is kept here. */
  fileName: string | null;
}

/** The file a resident sent, as far as their row names it. */
export interface SentFile {
  /** The key of the clarification, which its file is asked by. */
  clarificationId: string;
  name: string;
}

/** What can be done or read in the Klarifikasi cell of a row. */
export type ClarificationAction = "ask" | "ask_again" | "closed";

/** What the Klarifikasi cell of a row of Riwayat shows. */
export interface ClarificationCell {
  /** The status of the newest clarification, or null when none was sent. */
  badge: DormClarificationStatus | null;
  /** The note of a rejection or a closing, or empty. */
  note: string;
  file: SentFile | null;
  action: ClarificationAction | null;
}

/** A row of Riwayat with what its Klarifikasi cell shows. */
export interface ClarifiedEntry extends HistoryEntry {
  clarification: ClarificationCell;
}

export const CLARIFICATION_BADGE_WORDS: Record<
  DormClarificationStatus,
  string
> = {
  submitted: "Klarifikasi diajukan",
  verified: "Klarifikasi diverifikasi BAM",
  accepted: "Klarifikasi diterima",
  rejected: "Klarifikasi ditolak",
  closed: "Klarifikasi ditutup",
};

export const CLARIFICATION_ACTION_WORDS: Record<ClarificationAction, string> = {
  ask: "Ajukan klarifikasi",
  ask_again: "Ajukan ulang",
  closed: "Batas klarifikasi lewat",
};

/** Whether a resident may send another after this one: it was rejected or closed. */
function isOver(status: DormClarificationStatus): boolean {
  return status === "rejected" || status === "closed";
}

/**
 * What the Klarifikasi cell of an activity on `day` shows a resident on
 * `today` on campus. Only Tidak hadir may be clarified. With none sent,
 * the first try while the time is open, or that the time is over. With
 * one sent, its status and its file, and after a rejection or a closing
 * its note and a second try while the absence stands and the time is
 * open.
 */
export function clarificationCell(parts: {
  status: HistoryStatus;
  day: string;
  today: string;
  newest: ShownClarification | null;
}): ClarificationCell {
  const { status, day, today, newest } = parts;
  const isAbsent = status === "absent";
  const isOpen = clarificationOpen(day, today);
  if (newest === null) {
    const nothingSent = { badge: null, note: "", file: null };
    if (!isAbsent) return { ...nothingSent, action: null };
    return { ...nothingSent, action: isOpen ? "ask" : "closed" };
  }
  const file =
    newest.fileName === null
      ? null
      : { clarificationId: newest.id, name: newest.fileName };
  if (!isOver(newest.status)) {
    return { badge: newest.status, note: "", file, action: null };
  }
  const mayAskAgain = isAbsent && isOpen;
  return {
    badge: newest.status,
    note: newest.note,
    file,
    action: mayAskAgain ? "ask_again" : null,
  };
}

/** Whether a cell lets the resident send a clarification. */
export function takesClarification(cell: ClarificationCell): boolean {
  return cell.action === "ask" || cell.action === "ask_again";
}

/**
 * The note a resident reads under a clarification: that of Pengelola
 * Asrama when they rejected it, else that of BAM, and that of the closing
 * for a closed one. Nothing for one that waits or was accepted.
 */
export function shownNote(
  status: DormClarificationStatus,
  verifyNote: string,
  decisionNote: string,
): string {
  if (status === "closed") return decisionNote;
  if (status !== "rejected") return "";
  return decisionNote === "" ? verifyNote : decisionNote;
}

const WAITING: readonly DormClarificationStatus[] = WAITING_STATUSES;

/** "Klarifikasi aktif": how many wait for BAM or for Pengelola Asrama. */
export function waitingCount(statuses: DormClarificationStatus[]): number {
  return statuses.filter((status) => WAITING.includes(status)).length;
}
