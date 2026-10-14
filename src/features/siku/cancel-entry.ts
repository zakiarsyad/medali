import { and, eq, isNull } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { sikuAdjustmentChanges, sikuAdjustments } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  ALREADY_CANCELLED,
  ENTRY_NOT_FOUND,
  NOT_ALLOWED_TO_ADJUST,
} from "./siku-messages";

async function cancel(
  tx: Database,
  actorId: string,
  id: string,
): Promise<Parsed<null>> {
  // A second cancel at the same moment waits here for the first to end,
  // then finds the entry cancelled already.
  const cancelled = await tx
    .update(sikuAdjustments)
    .set({ cancelledBy: actorId, cancelledAt: WRITTEN_NOW })
    .where(and(eq(sikuAdjustments.id, id), isNull(sikuAdjustments.cancelledAt)))
    .returning({ id: sikuAdjustments.id });
  if (cancelled.length === 0) {
    const [kept] = await tx
      .select({ id: sikuAdjustments.id })
      .from(sikuAdjustments)
      .where(eq(sikuAdjustments.id, id));
    return kept ? ALREADY_CANCELLED : ENTRY_NOT_FOUND;
  }
  await tx.insert(sikuAdjustmentChanges).values({
    adjustmentId: id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    action: "cancelled",
  });
  return { ok: true, value: null };
}

/**
 * "Batalkan": takes an entry out of every SIKU it counted in. It is marked
 * as cancelled, with who and when, never erased, and the log gets a line.
 * Anyone with the right Penilaian SIKU may cancel an entry someone else
 * made. Refused for any other role, for an entry that is not there, and
 * for one cancelled before.
 */
export async function cancelSikuEntry(
  db: Database,
  actor: AccountForAccess,
  id: string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "adjust_siku")) return NOT_ALLOWED_TO_ADJUST;
  if (!isUuid(id)) return ENTRY_NOT_FOUND;
  return db.transaction((tx) => cancel(tx, actor.id, id));
}
