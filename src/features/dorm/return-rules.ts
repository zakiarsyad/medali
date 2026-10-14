import { shownMoment } from "@/ui/day";
import type { LeaveKind, LeaveStatus, ReportStatus } from "./leave-ids";
import { REPORT_OPENS_MINUTES } from "./leave-ids";
import {
  ALREADY_BACK,
  LEAVE_NOT_APPROVED,
  NEEDS_NO_REPORT,
  reportNotOpen,
} from "./return-messages";

/*
 * When a resident reports back from leave, and how late. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

const MINUTE_MS = 60 * 1000;

/** What a leave holds that decides its return. */
export interface ReturningLeave {
  kind: LeaveKind;
  status: LeaveStatus;
  startsAt: Date;
  endsAt: Date;
}

/** Izin pesiar and Izin khusus are reported back from; ITMK is not. */
export function needsReturn(kind: LeaveKind): boolean {
  return kind !== "skip_activities";
}

/**
 * When "Lapor kembali ke asrama" opens: some minutes before the return
 * time, but never before the leave starts, as a return is never earlier
 * than the start.
 */
export function reportOpensAt(
  leave: Pick<ReturningLeave, "startsAt" | "endsAt">,
): Date {
  const opens = new Date(
    leave.endsAt.getTime() - REPORT_OPENS_MINUTES * MINUTE_MS,
  );
  return opens > leave.startsAt ? opens : leave.startsAt;
}

/**
 * How many minutes after the return time a return is, counting a part
 * of a minute as a whole one; 0 for a return on time.
 */
export function lateMinutes(returnedAt: Date, endsAt: Date): number {
  const late = returnedAt.getTime() - endsAt.getTime();
  if (late <= 0) return 0;
  return Math.ceil(late / MINUTE_MS);
}

/** Whether a return was late, and "Tepat waktu" or "Terlambat 12 menit". */
export interface Timeliness {
  late: boolean;
  words: string;
}

export function timelinessOf(returnedAt: Date, endsAt: Date): Timeliness {
  const minutes = lateMinutes(returnedAt, endsAt);
  if (minutes === 0) return { late: false, words: "Tepat waktu" };
  return { late: true, words: `Terlambat ${minutes} menit` };
}

/**
 * Why a report of a return from a leave is refused at a moment, or null
 * when it may be sent: ITMK needs none, leave that is Selesai has its
 * return already, other leave than approved has none, and the report
 * opens some minutes before the return time.
 */
export function reportFault(leave: ReturningLeave, at: Date) {
  if (!needsReturn(leave.kind)) return NEEDS_NO_REPORT;
  if (leave.status === "completed") return ALREADY_BACK;
  if (leave.status !== "approved") return LEAVE_NOT_APPROVED;
  const opens = reportOpensAt(leave);
  if (at < opens) return reportNotOpen(shownMoment(opens));
  return null;
}

/** The latest report of a leave as the resident's history reads it. */
export interface LatestReport {
  status: ReportStatus;
  sentAt: Date;
  /** The note of whoever rejected it; empty for any other. */
  rejectionNote: string;
}

/** Whether a report still waits for BAM - BPHK or Pengelola Asrama. */
export function isOpenReport(report: LatestReport | null): boolean {
  if (report === null) return false;
  return report.status === "waiting" || report.status === "verified";
}

/** What "Riwayat izin saya" offers and says about the return from a leave. */
export type OwnReturn =
  | { kind: "none" }
  /** Lapor kembali dibuka (time). */
  | { kind: "opens"; at: string }
  /** "Lapor kembali ke asrama", after the note of a rejected report when there is one. */
  | { kind: "open"; rejectionNote: string | null }
  /** A report that waits, with when it was sent and how late. */
  | {
      kind: "sent";
      status: ReportStatus;
      sentAt: string;
      timeliness: Timeliness;
    }
  /** Back: the actual return and how late. */
  | { kind: "back"; returnedAt: string; timeliness: Timeliness };

/**
 * What the resident's history shows about the return from a leave at a
 * moment, from its latest report and its actual return. Nothing for
 * ITMK and for leave that is not approved.
 */
export function ownReturnOf(
  leave: ReturningLeave & { returnedAt: Date | null },
  report: LatestReport | null,
  now: Date,
): OwnReturn {
  if (!needsReturn(leave.kind)) return { kind: "none" };
  if (leave.status === "completed" && leave.returnedAt !== null) {
    return {
      kind: "back",
      returnedAt: shownMoment(leave.returnedAt),
      timeliness: timelinessOf(leave.returnedAt, leave.endsAt),
    };
  }
  if (leave.status !== "approved") return { kind: "none" };
  if (report !== null && isOpenReport(report)) {
    return {
      kind: "sent",
      status: report.status,
      sentAt: shownMoment(report.sentAt),
      timeliness: timelinessOf(report.sentAt, leave.endsAt),
    };
  }
  const opens = reportOpensAt(leave);
  if (now < opens) return { kind: "opens", at: shownMoment(opens) };
  const rejectionNote = report === null ? null : report.rejectionNote;
  return { kind: "open", rejectionNote };
}
