import type {
  activityClarificationReason,
  activityClarificationStatus,
} from "@/db/schema";

/*
 * Read by the form in the browser, so nothing here may take from the
 * database code: only the types of the table are taken.
 */

/** Why a student says they were not recorded as present. */
export type ClarificationReason =
  (typeof activityClarificationReason.enumValues)[number];

/** Where a stored clarification stands. */
export type ClarificationStatus =
  (typeof activityClarificationStatus.enumValues)[number];

/** The reasons in the order the form lists them, each as the screens say it. */
export const REASON_WORDS: Record<ClarificationReason, string> = {
  sick: "Sakit",
  family_matter: "Urusan keluarga mendesak",
  campus_duty: "Tugas institusi atau lomba",
  technical_trouble: "Kendala teknis presensi",
  present_not_recorded: "Sudah hadir tetapi tidak tercatat",
  other: "Lainnya",
};

export const CLARIFICATION_REASONS = Object.keys(
  REASON_WORDS,
) as ClarificationReason[];

/** The reason a form sent, or null when it is none of the list. */
export function reasonOf(sent: string): ClarificationReason | null {
  return CLARIFICATION_REASONS.find((reason) => reason === sent) ?? null;
}

/** The Keterangan an attendance gets from an accepted clarification. */
export function acceptedNote(reason: ClarificationReason): string {
  return `Klarifikasi: ${REASON_WORDS[reason]}`;
}
