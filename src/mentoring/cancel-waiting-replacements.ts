import { and, inArray } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { mentorReplacements } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import { IS_WAITING } from "./waiting-replacement";

/**
 * Cancels the replacements of these groups that wait for their start
 * date, as the work of an account. Used when the groups are ended: a
 * replacement of an ended group could never be carried out, and its new
 * mentor would stay kept for it.
 */
export async function cancelWaitingReplacementsOf(
  tx: Database,
  groupIds: string[],
  cancelledBy: string,
): Promise<void> {
  if (groupIds.length === 0) return;
  await tx
    .update(mentorReplacements)
    .set({ cancelledBy, cancelledAt: WRITTEN_NOW })
    .where(and(inArray(mentorReplacements.groupId, groupIds), IS_WAITING));
}
