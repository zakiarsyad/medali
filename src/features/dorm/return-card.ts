import { shownMoment } from "@/ui/day";
import { removedFileWords } from "@/ui/removed-file";
import { LEAVE_ADDRESS } from "./leave-address";
import type { ReportStatus } from "./leave-ids";
import { type Timeliness, timelinessOf } from "./return-rules";

/*
 * The report of a return as a card of Perizinan asrama shows it. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const NO_RETURN_PHOTO_HERE = "Foto tidak tersimpan di sini.";

/** One check of a report: who made it, what it decided and its note. */
export interface CheckWords {
  by: string;
  /** Diverifikasi, Divalidasi or Ditolak. */
  result: string;
  note: string;
}

export interface ReportCard {
  id: string;
  hasPhoto: boolean;
  /** What the card says once the photo was removed as old proof, or null. */
  removed: string | null;
  status: ReportStatus;
  /** When it was sent, such as 14 Okt 2026, 16.12. */
  sentAt: string;
  timeliness: Timeliness;
  /** What BAM - BPHK decided; null while it waits for them. */
  verification: CheckWords | null;
  /** What Pengelola Asrama decided; null until they decide. */
  validation: CheckWords | null;
}

/** What a kept report holds that its card shows. */
export interface KeptReport {
  id: string;
  photoKey: string | null;
  fileRemovedAt: Date | null;
  status: ReportStatus;
  sentAt: Date;
  verifiedAt: Date | null;
  verifyNote: string;
  validatedAt: Date | null;
  validateNote: string;
}

/** The names of who checked a report; null for an account that is gone. */
export interface Checkers {
  verifiedBy: string | null;
  validatedBy: string | null;
}

/**
 * BAM - BPHK's check: Diverifikasi, or Ditolak when they rejected it,
 * which is a rejection that Pengelola Asrama did not make.
 */
function verificationOf(
  report: KeptReport,
  by: string | null,
): CheckWords | null {
  if (report.verifiedAt === null) return null;
  const rejectedByBam =
    report.status === "rejected" && report.validatedAt === null;
  return {
    by: by ?? "-",
    result: rejectedByBam ? "Ditolak" : "Diverifikasi",
    note: report.verifyNote,
  };
}

function validationOf(
  report: KeptReport,
  by: string | null,
): CheckWords | null {
  if (report.validatedAt === null) return null;
  return {
    by: by ?? "-",
    result: report.status === "validated" ? "Divalidasi" : "Ditolak",
    note: report.validateNote,
  };
}

/** A report as its card shows it, measured against the return time of its leave. */
export function reportCardOf(
  report: KeptReport,
  checkers: Checkers,
  endsAt: Date,
): ReportCard {
  return {
    id: report.id,
    hasPhoto: report.photoKey !== null && report.fileRemovedAt === null,
    removed: removedFileWords(report.fileRemovedAt),
    status: report.status,
    sentAt: shownMoment(report.sentAt),
    timeliness: timelinessOf(report.sentAt, endsAt),
    verification: verificationOf(report, checkers.verifiedBy),
    validation: validationOf(report, checkers.validatedBy),
  };
}

/** The address a report's photo is shown from. */
export function returnPhotoAddress(reportId: string): string {
  return `${LEAVE_ADDRESS}/foto/${reportId}`;
}
