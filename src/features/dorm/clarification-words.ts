import type {
  AcceptedAs,
  DormClarificationReason,
  DormClarificationStatus,
} from "./clarification-ids";

/*
 * How the screens name the parts of a dorm clarification. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const REASON_WORDS: Record<DormClarificationReason, string> = {
  sick: "Sakit",
  family_matter: "Urusan keluarga mendesak",
  campus_duty: "Tugas institusi atau lomba",
  present_not_recorded: "Sudah hadir tetapi tidak tercatat",
  other: "Lainnya",
};

/** Each status as the cards and the status choice name it. */
export const STATUS_WORDS: Record<DormClarificationStatus, string> = {
  submitted: "Diajukan",
  verified: "Diverifikasi BAM",
  accepted: "Diterima",
  rejected: "Ditolak",
  closed: "Ditutup",
};

export const ACCEPTED_WORDS: Record<AcceptedAs, string> = {
  present: "Diterima sebagai hadir",
  leave: "Diterima sebagai izin",
};

/** The note a clarification is closed with when BAM withdraws the absence. */
export const WITHDRAWN_NOTE =
  "Ketidakhadiran dibatalkan BAM pada pengumuman ulang.";
