import { and, eq, gt, isNull } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormViolationChanges, dormViolations } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { isOwnRecord, OWN_RECORD } from "./own-record";
import {
  ALREADY_ANNOUNCED,
  ALREADY_CANCELLED,
  NOT_ALLOWED_TO_RECORD,
  VIOLATION_NOT_FOUND,
} from "./violation-messages";

/** Why a violation that was not cancelled now could not be. */
async function whyNotCancelled(
  tx: Database,
  id: string,
): Promise<Parsed<null>> {
  const [kept] = await tx
    .select({ cancelledAt: dormViolations.cancelledAt })
    .from(dormViolations)
    .where(eq(dormViolations.id, id));
  if (!kept) return VIOLATION_NOT_FOUND;
  return kept.cancelledAt === null ? ALREADY_ANNOUNCED : ALREADY_CANCELLED;
}

/** Whether a violation is of the account's own student. */
async function isOwnViolation(
  db: Database,
  actor: AccountForAccess,
  id: string,
): Promise<boolean> {
  if (actor.studentId === null) return false;
  const [kept] = await db
    .select({ studentId: dormViolations.studentId })
    .from(dormViolations)
    .where(eq(dormViolations.id, id));
  if (kept === undefined) return false;
  return isOwnRecord(actor.studentId, kept.studentId);
}

async function cancel(
  tx: Database,
  actorId: string,
  id: string,
  moment: Date,
): Promise<Parsed<null>> {
  // One statement checks the hour and marks the row, so a cancel at the
  // announcement hour either wins whole or changes nothing. A second
  // cancel at the same moment waits here for the first to end, then
  // finds the row cancelled already.
  const cancelled = await tx
    .update(dormViolations)
    .set({ cancelledBy: actorId, cancelledAt: moment })
    .where(
      and(
        eq(dormViolations.id, id),
        isNull(dormViolations.cancelledAt),
        gt(dormViolations.announcedAt, moment),
      ),
    )
    .returning({ id: dormViolations.id });
  if (cancelled.length === 0) return whyNotCancelled(tx, id);
  await tx.insert(dormViolationChanges).values({
    violationId: id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    action: "cancelled",
  });
  return { ok: true, value: null };
}

/**
 * "Batalkan" on a row of Jadwal publikasi: the violation is never
 * announced. It is marked as cancelled, with who and when, never erased,
 * and the log gets a line. Any account that may record violations may
 * cancel one another recorded. Refused for any other role, for the
 * account's own violation, for a violation that is not there, for one
 * cancelled before, and from its announcement hour on, by the server's
 * clock.
 */
export async function cancelViolation(
  db: Database,
  actor: AccountForAccess,
  id: string,
  moment: Date = new Date(),
): Promise<Parsed<null>> {
  if (!may(actor.roles, "record_dorm_violations")) return NOT_ALLOWED_TO_RECORD;
  if (!isUuid(id)) return VIOLATION_NOT_FOUND;
  if (await isOwnViolation(db, actor, id)) return OWN_RECORD;
  return db.transaction((tx) => cancel(tx, actor.id, id, moment));
}
