import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  dormViolationAppeals,
  dormViolationChanges,
  dormViolations,
  students,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  type AppealDecision,
  DECIDED_WORDS,
  parseAppealDecision,
} from "./appeal-decision";
import {
  APPEAL_DECIDED_BEFORE,
  APPEAL_NOT_FOUND,
  DECIDE_NOT_ALLOWED,
  OWN_APPEAL,
} from "./appeal-messages";

/** A decision as the card sends it: nothing in it is trusted. */
export interface SentAppealDecision {
  kind: unknown;
  note: unknown;
}

/** The student whose violation an appeal is of, when the decider sees them. */
async function studentOfAppeal(
  db: Database,
  actor: AccountForAccess,
  id: string,
): Promise<string | null> {
  const visible = visibleTo(
    rowLimitForAction(actor, "decide_dorm_violation_appeals"),
  );
  const [found] = await db
    .select({ studentId: dormViolations.studentId })
    .from(dormViolationAppeals)
    .innerJoin(
      dormViolations,
      eq(dormViolations.id, dormViolationAppeals.violationId),
    )
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(and(eq(dormViolationAppeals.id, id), visible));
  return found?.studentId ?? null;
}

/**
 * Saves the decision with its line in the log. One statement checks that
 * the appeal still waits and decides it, so of two decisions at the same
 * moment the second waits for the first, then finds it decided.
 */
function save(
  db: Database,
  actorId: string,
  id: string,
  decision: AppealDecision,
  at: Date,
): Promise<Parsed<string>> {
  return db.transaction(async (tx) => {
    const decided = await tx
      .update(dormViolationAppeals)
      .set({
        status: decision.kind === "accept" ? "accepted" : "rejected",
        decidedBy: actorId,
        decidedAt: at,
        decisionNote: decision.note,
      })
      .where(
        and(
          eq(dormViolationAppeals.id, id),
          eq(dormViolationAppeals.status, "waiting"),
        ),
      )
      .returning({ violationId: dormViolationAppeals.violationId });
    const [appeal] = decided;
    if (!appeal) return APPEAL_DECIDED_BEFORE;
    await tx.insert(dormViolationChanges).values({
      violationId: appeal.violationId,
      changedBy: actorId,
      changedAt: WRITTEN_NOW,
      action:
        decision.kind === "accept" ? "appeal_accepted" : "appeal_rejected",
    });
    return { ok: true, value: DECIDED_WORDS[decision.kind] };
  });
}

/**
 * "Terima" or "Tolak" on a waiting appeal, with Catatan BAM, for BAM -
 * BPHK and BAM - KI only; anyone else is refused before anything is
 * read. A decider may not decide an appeal of the student their account
 * belongs to: the other deciders do. Only an appeal that still waits is
 * decided, so a decision saved first wins. `id`, and what was decided,
 * come from outside and are not trusted; `at` is the moment on the
 * server's clock.
 */
export async function decideViolationAppeal(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentAppealDecision,
  at: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "decide_dorm_violation_appeals")) {
    return DECIDE_NOT_ALLOWED;
  }
  if (!isUuid(id)) return APPEAL_NOT_FOUND;
  const decision = parseAppealDecision(sent.kind, sent.note);
  if (!decision.ok) return decision;
  const studentId = await studentOfAppeal(db, actor, id);
  if (studentId === null) return APPEAL_NOT_FOUND;
  if (studentId === actor.studentId) return OWN_APPEAL;
  return save(db, actor.id, id, decision.value, at);
}
