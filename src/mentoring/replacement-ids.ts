import type { MentorStatus } from "@/ui/mentor-status";

/** Why a group gets another mentor, in the order the form offers them. */
export const REPLACEMENT_REASONS = [
  "poor_evaluation",
  "transfer",
  "retirement",
  "study_leave",
  "own_request",
  "other",
] as const;

export type ReplacementReason = (typeof REPLACEMENT_REASONS)[number];

export const REPLACEMENT_REASON_TITLES: Record<ReplacementReason, string> = {
  poor_evaluation: "Hasil evaluasi kurang",
  transfer: "Mutasi",
  retirement: "Pensiun",
  study_leave: "Tugas belajar",
  own_request: "Permintaan sendiri",
  other: "Lainnya",
};

/** What the mentor who leaves a group becomes: Cadangan or Tidak aktif. */
export const OLD_MENTOR_STATUSES = [
  "reserve",
  "inactive",
] as const satisfies readonly MentorStatus[];

export type OldMentorStatus = (typeof OLD_MENTOR_STATUSES)[number];
