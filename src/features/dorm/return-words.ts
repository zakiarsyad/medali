import type { ReportStatus } from "./leave-ids";

/*
 * How the screens name where a report of a return stands. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const REPORT_STATUS_WORDS: Record<ReportStatus, string> = {
  waiting: "Menunggu verifikasi BAM",
  verified: "Diverifikasi BAM",
  rejected: "Ditolak",
  validated: "Divalidasi",
};
