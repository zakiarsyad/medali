import { and, eq, isNull, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students, violationNoteChanges, violationNotes } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  ALREADY_REMOVED,
  NOT_ALLOWED_TO_WRITE,
  NOTE_NOT_FOUND,
} from "./note-messages";

/**
 * A note of a student the actor's roles with the right to write see,
 * whatever the student's status now: a note of a student gone on Cuti
 * may still be removed.
 */
function ofSeenStudent(actor: AccountForAccess): SQL {
  const seen = visibleTo(rowLimitForAction(actor, "write_violation_notes"));
  return sql`exists (select 1 from ${students} where ${students.id} = ${violationNotes.studentId} and ${seen})`;
}

/** Why a note the actor may see was not removed now. */
async function whyNotRemoved(
  tx: Database,
  actor: AccountForAccess,
  id: string,
): Promise<Parsed<null>> {
  const [kept] = await tx
    .select({ removedAt: violationNotes.removedAt })
    .from(violationNotes)
    .where(and(eq(violationNotes.id, id), ofSeenStudent(actor)));
  if (!kept || kept.removedAt === null) return NOTE_NOT_FOUND;
  return ALREADY_REMOVED;
}

async function remove(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  moment: Date,
): Promise<Parsed<null>> {
  // A second removal at the same moment waits here for the first to end,
  // then finds the note removed already.
  const removed = await tx
    .update(violationNotes)
    .set({ removedBy: actor.id, removedAt: moment })
    .where(
      and(
        eq(violationNotes.id, id),
        isNull(violationNotes.removedAt),
        ofSeenStudent(actor),
      ),
    )
    .returning({ id: violationNotes.id });
  if (removed.length === 0) return whyNotRemoved(tx, actor, id);
  await tx.insert(violationNoteChanges).values({
    noteId: id,
    changedBy: actor.id,
    changedAt: WRITTEN_NOW,
    action: "removed",
  });
  return { ok: true, value: null };
}

/**
 * "Hapus" on a note: it leaves the list and the numbers, and the
 * Kategori of the student's other notes is worked out again without it.
 * It is marked as removed, with who and when, never erased, and the log
 * gets a line. Refused for a role without the right to write notes, for
 * a note that is not there, and for one removed before.
 */
export async function removeViolationNote(
  db: Database,
  actor: AccountForAccess,
  id: string,
  moment: Date = new Date(),
): Promise<Parsed<null>> {
  if (!may(actor.roles, "write_violation_notes")) return NOT_ALLOWED_TO_WRITE;
  if (!isUuid(id)) return NOTE_NOT_FOUND;
  return db.transaction((tx) => remove(tx, actor, id, moment));
}
