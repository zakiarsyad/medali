import { and, eq } from "drizzle-orm";
import type { AccountForAccess, RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { mentorGroups, mentorReplacements } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import { IS_WAITING } from "@/mentoring/waiting-replacement";
import type { Parsed } from "@/parsed";
import { maySeeGroup } from "./visible-groups";
import { replacedRowsFor } from "./visible-replacements";

/** What a cancel answers to any role but Kepala Unit. */
export const NOT_ALLOWED_TO_CANCEL = {
  ok: false,
  error: "Anda tidak berhak membatalkan penggantian pengasuh.",
} as const;

export const REPLACEMENT_NOT_FOUND = {
  ok: false,
  error: "Penggantian ini tidak ditemukan. Muat ulang halaman, lalu coba lagi.",
} as const;

export const ALREADY_CANCELLED = {
  ok: false,
  error: "Penggantian ini sudah dibatalkan sebelumnya.",
} as const;

export const ALREADY_IN_FORCE = {
  ok: false,
  error:
    "Penggantian ini sudah berlaku, sehingga tidak dapat dibatalkan. Tetapkan penggantian baru bila pengasuh perlu diganti lagi.",
} as const;

/** The replacement when it is of a group the account may replace the mentor of. */
async function findReplacement(tx: Database, limit: RowLimit, id: string) {
  const [stored] = await tx
    .select({
      cancelledAt: mentorReplacements.cancelledAt,
      studyProgramId: mentorGroups.studyProgramId,
    })
    .from(mentorReplacements)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorReplacements.groupId))
    .where(eq(mentorReplacements.id, id));
  if (!stored || !maySeeGroup(limit, stored.studyProgramId)) return null;
  return stored;
}

/**
 * Marks a replacement cancelled while it still waits, with who and when.
 * False when it waits no more: the database looks again at the moment it
 * writes, so of two cancels at once, or a cancel beside the carrying out,
 * only one wins.
 */
async function cancelWhileWaiting(
  tx: Database,
  id: string,
  cancelledBy: string,
): Promise<boolean> {
  const cancelled = await tx
    .update(mentorReplacements)
    .set({ cancelledBy, cancelledAt: WRITTEN_NOW })
    .where(and(eq(mentorReplacements.id, id), IS_WAITING))
    .returning({ id: mentorReplacements.id });
  return cancelled.length > 0;
}

/**
 * "Batalkan" on a Terjadwal replacement: it becomes Dibatalkan, as the
 * work of the actor, and nothing changes for the group. It is never
 * erased. Refused for any role but Kepala Unit, for an id that names no
 * replacement, and for one that is cancelled already or in force.
 */
export async function cancelReplacement(
  db: Database,
  actor: AccountForAccess,
  id: string,
): Promise<Parsed<null>> {
  const limit = replacedRowsFor(actor);
  if (limit === null) return NOT_ALLOWED_TO_CANCEL;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return REPLACEMENT_NOT_FOUND;

  return db.transaction(async (tx) => {
    if ((await findReplacement(tx, limit, id)) === null) {
      return REPLACEMENT_NOT_FOUND;
    }
    if (await cancelWhileWaiting(tx, id, actor.id)) {
      return { ok: true, value: null };
    }
    const now = await findReplacement(tx, limit, id);
    if (now?.cancelledAt) return ALREADY_CANCELLED;
    return ALREADY_IN_FORCE;
  });
}
