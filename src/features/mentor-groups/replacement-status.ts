import type { mentorReplacements } from "@/db/schema";

type Replacement = typeof mentorReplacements.$inferSelect;

/** Berlaku, Terjadwal and Dibatalkan. */
export type ReplacementStatus = "in_force" | "scheduled" | "cancelled";

export const REPLACEMENT_STATUS_TITLES: Record<ReplacementStatus, string> = {
  in_force: "Berlaku",
  scheduled: "Terjadwal",
  cancelled: "Dibatalkan",
};

/**
 * The status of a replacement: Dibatalkan once it is cancelled, Berlaku
 * once the group has its new mentor, and Terjadwal while it waits for its
 * start date.
 */
export function replacementStatus(
  replacement: Pick<Replacement, "carriedOutAt" | "cancelledAt">,
): ReplacementStatus {
  if (replacement.cancelledAt !== null) return "cancelled";
  if (replacement.carriedOutAt !== null) return "in_force";
  return "scheduled";
}
