import type {
  OldMentorStatus,
  ReplacementReason,
} from "@/mentoring/replacement-ids";

/** The reasons after which the old mentor can no longer take a group. */
const LEAVES_CAMPUS: readonly ReplacementReason[] = [
  "transfer",
  "retirement",
  "study_leave",
];

/**
 * What the form sets for "Status pengasuh lama" when a reason is chosen:
 * Tidak aktif for Mutasi, Pensiun and Tugas belajar, else Cadangan.
 */
export function oldMentorStatusFor(reason: ReplacementReason): OldMentorStatus {
  if (LEAVES_CAMPUS.includes(reason)) return "inactive";
  return "reserve";
}
