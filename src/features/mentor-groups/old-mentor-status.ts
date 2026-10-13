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

/** What "Status pengasuh lama" holds, and whether the person chose it. */
export interface ShownOldStatus {
  status: OldMentorStatus;
  wasChosen: boolean;
}

/**
 * What "Status pengasuh lama" holds once a reason is chosen. A reason
 * after which the mentor leaves the campus always sets Tidak aktif. Any
 * other reason keeps what the person chose themselves, and sets Cadangan
 * while they chose nothing.
 */
export function statusAfterReason(
  reason: ReplacementReason,
  shown: ShownOldStatus,
): OldMentorStatus {
  const set = oldMentorStatusFor(reason);
  if (set === "inactive") return set;
  return shown.wasChosen ? shown.status : set;
}
