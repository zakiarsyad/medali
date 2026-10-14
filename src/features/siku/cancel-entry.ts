import { and, eq, isNull } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  sikuAdjustmentChanges,
  sikuAdjustments,
  sikuUploads,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  ALREADY_CANCELLED,
  ENTRY_NOT_FOUND,
  NOT_ALLOWED_TO_ADJUST,
} from "./siku-messages";
import { IN_FORCE } from "./siku-totals";

/** A row of an upload is cancelled with its upload only, never alone. */
const FROM_FORM = isNull(sikuAdjustments.uploadId);

async function logCancels(
  tx: Database,
  actorId: string,
  ids: readonly { id: string }[],
): Promise<void> {
  await tx.insert(sikuAdjustmentChanges).values(
    ids.map(({ id }) => ({
      adjustmentId: id,
      changedBy: actorId,
      changedAt: WRITTEN_NOW,
      action: "cancelled" as const,
    })),
  );
}

/** Cancels every row of an upload still in force, in one go. */
async function cancelUpload(
  tx: Database,
  actorId: string,
  id: string,
): Promise<Parsed<null>> {
  // A second cancel at the same moment waits here for the first to end,
  // then finds every row cancelled already.
  const cancelled = await tx
    .update(sikuAdjustments)
    .set({ cancelledBy: actorId, cancelledAt: WRITTEN_NOW })
    .where(and(eq(sikuAdjustments.uploadId, id), IN_FORCE))
    .returning({ id: sikuAdjustments.id });
  if (cancelled.length === 0) return ALREADY_CANCELLED;
  await logCancels(tx, actorId, cancelled);
  return { ok: true, value: null };
}

async function cancelEntry(
  tx: Database,
  actorId: string,
  id: string,
): Promise<Parsed<null>> {
  const cancelled = await tx
    .update(sikuAdjustments)
    .set({ cancelledBy: actorId, cancelledAt: WRITTEN_NOW })
    .where(and(eq(sikuAdjustments.id, id), FROM_FORM, IN_FORCE))
    .returning({ id: sikuAdjustments.id });
  if (cancelled.length === 0) {
    const [kept] = await tx
      .select({ id: sikuAdjustments.id })
      .from(sikuAdjustments)
      .where(and(eq(sikuAdjustments.id, id), FROM_FORM));
    return kept ? ALREADY_CANCELLED : ENTRY_NOT_FOUND;
  }
  await logCancels(tx, actorId, cancelled);
  return { ok: true, value: null };
}

async function cancel(
  tx: Database,
  actorId: string,
  id: string,
): Promise<Parsed<null>> {
  const [upload] = await tx
    .select({ id: sikuUploads.id })
    .from(sikuUploads)
    .where(eq(sikuUploads.id, id));
  if (upload) return cancelUpload(tx, actorId, id);
  return cancelEntry(tx, actorId, id);
}

/**
 * "Batalkan": takes an entry out of every SIKU it counted in. It is marked
 * as cancelled, with who and when, never erased, and the log gets a line.
 * An upload is an entry too: every row of it is cancelled at once, each
 * with a line in the log.
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
