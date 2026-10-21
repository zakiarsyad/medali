import { and, eq, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  disciplinePenalties,
  disciplinePenaltyChanges,
  students,
} from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  type FollowUpValues,
  isFollowUpStatus,
  type PenaltyFollowUp,
  withStatus,
} from "./penalty-follow-up";
import type { PENALTY_CHANGE_ACTIONS } from "./penalty-ids";
import {
  NOT_A_FOLLOW_UP_STATUS,
  NOT_ALLOWED_TO_FOLLOW_UP,
  PENALTY_NOT_FOUND,
} from "./penalty-messages";

type FollowUpAction = Exclude<(typeof PENALTY_CHANGE_ACTIONS)[number], "added">;

/**
 * A penalty of a student the actor's roles with the right to follow up
 * see, whatever the student's status now: a suspended student is
 * followed up while away.
 */
function ofFollowedStudent(actor: AccountForAccess) {
  const seen = visibleTo(
    rowLimitForAction(actor, "follow_up_discipline_penalties"),
  );
  return sql`exists (select 1 from ${students} where ${students.id} = ${disciplinePenalties.studentId} and ${seen})`;
}

/**
 * The follow-up of a penalty the actor may follow up, held until the
 * change ends: a second change of the same penalty waits here, then
 * reads what the first one left.
 */
async function holdPenalty(
  tx: Database,
  actor: AccountForAccess,
  id: string,
): Promise<PenaltyFollowUp | undefined> {
  const [held] = await tx
    .select({
      status: disciplinePenalties.status,
      conditionsMet: disciplinePenalties.conditionsMet,
      decision: disciplinePenalties.decision,
      version: disciplinePenalties.version,
    })
    .from(disciplinePenalties)
    .where(and(eq(disciplinePenalties.id, id), ofFollowedStudent(actor)))
    .for("update");
  return held;
}

function sameValues(one: FollowUpValues, other: FollowUpValues): boolean {
  return (
    one.status === other.status &&
    one.decision === other.decision &&
    one.conditionsMet.join() === other.conditionsMet.join()
  );
}

/** Keeps the follow-up with a version up, and logs it with what it was before. */
async function keepFollowUp(
  tx: Database,
  actorId: string,
  id: string,
  before: PenaltyFollowUp,
  after: FollowUpValues,
  action: FollowUpAction,
): Promise<PenaltyFollowUp> {
  const version = before.version + 1;
  await tx
    .update(disciplinePenalties)
    .set({ ...after, version })
    .where(eq(disciplinePenalties.id, id));
  await tx.insert(disciplinePenaltyChanges).values({
    penaltyId: id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    action,
    statusBefore: before.status,
    statusAfter: after.status,
    conditionsBefore: before.conditionsMet,
    conditionsAfter: after.conditionsMet,
    decisionBefore: before.decision,
    decisionAfter: after.decision,
  });
  return { ...after, version };
}

/**
 * Applies a change to a held penalty: refused, with nothing kept, when
 * the rule refuses it; kept and logged when it changes something.
 */
async function followUp(
  db: Database,
  actor: AccountForAccess,
  id: string,
  action: FollowUpAction,
  change: (before: FollowUpValues) => Parsed<FollowUpValues>,
): Promise<Parsed<PenaltyFollowUp>> {
  if (!isUuid(id)) return PENALTY_NOT_FOUND;
  return db.transaction(async (tx) => {
    const before = await holdPenalty(tx, actor, id);
    if (before === undefined) return PENALTY_NOT_FOUND;
    const changed = change(before);
    if (!changed.ok) return changed;
    if (sameValues(before, changed.value)) return { ok: true, value: before };
    const kept = await keepFollowUp(
      tx,
      actor.id,
      id,
      before,
      changed.value,
      action,
    );
    return { ok: true, value: kept };
  });
}

/**
 * The status choice of a penalty in "Daftar pelanggaran": Dijatuhkan,
 * Sedang dijalani or Selesai dijalani. Refused, with nothing kept, for a
 * role without the right to follow up, for a penalty it may not see,
 * for any other status, and for a Ditetapkan penalty.
 */
export async function changePenaltyStatus(
  db: Database,
  actor: AccountForAccess,
  id: string,
  status: string,
): Promise<Parsed<PenaltyFollowUp>> {
  if (!may(actor.roles, "follow_up_discipline_penalties")) {
    return NOT_ALLOWED_TO_FOLLOW_UP;
  }
  if (!isFollowUpStatus(status)) return NOT_A_FOLLOW_UP_STATUS;
  return followUp(db, actor, id, "status_changed", (before) =>
    withStatus(before, status),
  );
}
