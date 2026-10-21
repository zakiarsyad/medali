import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  dormWarningLetterChanges,
  dormWarningLetters,
  students,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { parseHandlingNote } from "./proposal-input";
import {
  ALREADY_HANDLED,
  NO_PROPOSAL,
  OWN_PROPOSAL,
  PROPOSAL_HANDLED,
  PROPOSAL_NOT_ALLOWED,
} from "./warning-messages";

/** "Proses" of a proposal as the form sends it: nothing in it is trusted. */
export interface SentHandling {
  letterId: unknown;
  note: unknown;
}

/** The issued SP 2 under the key, of a student the account sees, or null. */
async function readProposal(
  db: Database,
  actor: AccountForAccess,
  letterId: unknown,
) {
  if (typeof letterId !== "string" || !isUuid(letterId)) return null;
  const visible = visibleTo(
    rowLimitForAction(actor, "handle_dorm_discipline_proposals"),
  );
  const [found] = await db
    .select({
      id: dormWarningLetters.id,
      studentId: dormWarningLetters.studentId,
      handledAt: dormWarningLetters.handledAt,
    })
    .from(dormWarningLetters)
    .innerJoin(students, eq(students.id, dormWarningLetters.studentId))
    .where(
      and(
        eq(dormWarningLetters.id, letterId),
        eq(dormWarningLetters.level, 2),
        isNotNull(dormWarningLetters.issuedAt),
        visible,
      ),
    );
  return found ?? null;
}

/**
 * Marks the proposal Diproses with its line in the log. One statement
 * sets the handling only while there is none, so of two at the same
 * moment the second waits for the first, then finds it handled.
 */
function save(
  db: Database,
  actorId: string,
  letterId: string,
  note: string,
  at: Date,
): Promise<Parsed<string>> {
  return db.transaction(async (tx) => {
    const [handled] = await tx
      .update(dormWarningLetters)
      .set({ handlingNote: note, handledBy: actorId, handledAt: at })
      .where(
        and(
          eq(dormWarningLetters.id, letterId),
          isNull(dormWarningLetters.handledAt),
        ),
      )
      .returning({ id: dormWarningLetters.id });
    if (!handled) return ALREADY_HANDLED;
    await tx.insert(dormWarningLetterChanges).values({
      letterId,
      changedBy: actorId,
      changedAt: WRITTEN_NOW,
      action: "handled",
    });
    return { ok: true, value: PROPOSAL_HANDLED };
  });
}

/**
 * "Proses" of a discipline proposal of Pengelola Asrama, with "Catatan
 * tindak lanjut", for Kepala Unit only; anyone else is refused before
 * anything is read. A proposal is handled once: a second press keeps the
 * first note and saves nothing more. Kepala Unit does not handle the
 * proposal about their own student. What was sent comes from outside and
 * is not trusted; `now` is the moment on the server's clock.
 */
export async function handleDisciplineProposal(
  db: Database,
  actor: AccountForAccess,
  sent: SentHandling,
  now: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "handle_dorm_discipline_proposals")) {
    return PROPOSAL_NOT_ALLOWED;
  }
  const note = parseHandlingNote(sent.note);
  if (!note.ok) return note;
  const proposal = await readProposal(db, actor, sent.letterId);
  if (proposal === null) return NO_PROPOSAL;
  if (proposal.studentId === actor.studentId) return OWN_PROPOSAL;
  if (proposal.handledAt !== null) return ALREADY_HANDLED;
  return save(db, actor.id, proposal.id, note.value, now);
}
