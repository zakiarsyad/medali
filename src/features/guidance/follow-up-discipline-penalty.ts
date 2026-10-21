import { and, eq } from "drizzle-orm";
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
  type FollowedPenalty,
  type FollowUpOutcome,
  type FollowUpValues,
  isContinuationCondition,
  isContinuationDecision,
  isFollowUpStatus,
  type PenaltyFollowUp,
  withCondition,
  withDecision,
  withStatus,
} from "./penalty-follow-up";
import type { PENALTY_CHANGE_ACTIONS } from "./penalty-ids";
import {
  NOT_A_CONDITION,
  NOT_A_DECISION,
  NOT_A_FOLLOW_UP_STATUS,
  NOT_ALLOWED_TO_FOLLOW_UP,
  PENALTY_NOT_FOUND,
  PENALTY_OUTDATED,
} from "./penalty-messages";
import { HAS_AGENCY } from "./penalty-student";

type FollowUpAction = Exclude<(typeof PENALTY_CHANGE_ACTIONS)[number], "added">;

type HeldPenalty = FollowedPenalty & { version: number };

/**
 * A penalty the actor may follow up, of a student its roles with that
 * right see, whatever the student's status now: a suspended student is
 * followed up while away. Held until the change ends: a second change
 * of the same penalty waits here, then reads what the first one left.
 */
async function holdPenalty(
  tx: Database,
  actor: AccountForAccess,
  id: string,
): Promise<HeldPenalty | undefined> {
  const seen = visibleTo(
    rowLimitForAction(actor, "follow_up_discipline_penalties"),
  );
  const [held] = await tx
    .select({
      status: disciplinePenalties.status,
      conditionsMet: disciplinePenalties.conditionsMet,
      decision: disciplinePenalties.decision,
      version: disciplinePenalties.version,
      category: disciplinePenalties.category,
      level: disciplinePenalties.level,
      hasAgency: HAS_AGENCY,
    })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(and(eq(disciplinePenalties.id, id), seen))
    .for("update", { of: disciplinePenalties });
  return held;
}

function mayFollowUp(actor: AccountForAccess): boolean {
  return may(actor.roles, "follow_up_discipline_penalties");
}

function followUpOf(held: HeldPenalty): PenaltyFollowUp {
  const { status, conditionsMet, decision, version } = held;
  return { status, conditionsMet, decision, version };
}

function sameValues(one: FollowUpValues, other: FollowUpValues): boolean {
  return (
    one.status === other.status &&
    one.decision === other.decision &&
    one.conditionsMet.join() === other.conditionsMet.join()
  );
}

/**
 * Keeps the follow-up with a version up, and logs it with what it was
 * before. Written only while the penalty still has the version the
 * screen showed, so a change made on an older one keeps nothing even
 * if the read before it missed that: undefined then.
 */
async function keepFollowUp(
  tx: Database,
  actorId: string,
  id: string,
  shown: number,
  before: FollowUpValues,
  after: FollowUpValues,
  action: FollowUpAction,
): Promise<PenaltyFollowUp | undefined> {
  const version = shown + 1;
  const written = await tx
    .update(disciplinePenalties)
    .set({ ...after, version })
    .where(
      and(
        eq(disciplinePenalties.id, id),
        eq(disciplinePenalties.version, shown),
      ),
    )
    .returning({ id: disciplinePenalties.id });
  if (written.length === 0) return undefined;
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
 * someone changed it since the screen showed `version`, or when the
 * rule refuses it; kept and logged when it changes something. The
 * penalty is held so a second change waits for the first, and the write
 * itself checks the version, so the second is refused either way.
 */
async function followUp(
  db: Database,
  actor: AccountForAccess,
  id: string,
  version: number,
  action: FollowUpAction,
  change: (before: FollowedPenalty) => Parsed<FollowUpValues>,
): Promise<FollowUpOutcome> {
  if (!isUuid(id)) return PENALTY_NOT_FOUND;
  return db.transaction(async (tx): Promise<FollowUpOutcome> => {
    const held = await holdPenalty(tx, actor, id);
    if (held === undefined) return PENALTY_NOT_FOUND;
    const before = followUpOf(held);
    const outdated = { ...PENALTY_OUTDATED, current: before };
    const isAsShown = held.version === version;
    const changed = change(held);
    if (!changed.ok) return isAsShown ? changed : outdated;
    if (isAsShown && sameValues(before, changed.value)) {
      return { ok: true, value: before };
    }
    const kept = await keepFollowUp(
      tx,
      actor.id,
      id,
      version,
      before,
      changed.value,
      action,
    );
    if (kept === undefined) return outdated;
    return { ok: true, value: kept };
  });
}

/**
 * The status choice of a penalty in "Daftar pelanggaran": Dijatuhkan,
 * Sedang dijalani or Selesai dijalani. Refused, with nothing kept, for a
 * role without the right to follow up, for a penalty it may not see or
 * that changed since the screen showed `version`,
 * for any other status, and for a Ditetapkan penalty.
 */
export async function changePenaltyStatus(
  db: Database,
  actor: AccountForAccess,
  id: string,
  version: number,
  status: string,
): Promise<FollowUpOutcome> {
  if (!mayFollowUp(actor)) return NOT_ALLOWED_TO_FOLLOW_UP;
  if (!isFollowUpStatus(status)) return NOT_A_FOLLOW_UP_STATUS;
  return followUp(db, actor, id, version, "status_changed", (before) =>
    withStatus(before, status),
  );
}

/**
 * A tick of Syarat melanjutkan studi in "Rincian", put or taken away.
 * Refused, with nothing kept, as a status change is, and for a penalty
 * without the conditions.
 */
export async function changePenaltyCondition(
  db: Database,
  actor: AccountForAccess,
  id: string,
  version: number,
  condition: string,
  met: boolean,
): Promise<FollowUpOutcome> {
  if (!mayFollowUp(actor)) return NOT_ALLOWED_TO_FOLLOW_UP;
  if (!isContinuationCondition(condition)) return NOT_A_CONDITION;
  return followUp(db, actor, id, version, "conditions_changed", (before) =>
    withCondition(before, condition, met),
  );
}

/**
 * Keputusan in "Rincian". Refused, with nothing kept, as a tick is, and
 * for Melanjutkan studi while a condition is not ticked.
 */
export async function changePenaltyDecision(
  db: Database,
  actor: AccountForAccess,
  id: string,
  version: number,
  decision: string,
): Promise<FollowUpOutcome> {
  if (!mayFollowUp(actor)) return NOT_ALLOWED_TO_FOLLOW_UP;
  if (!isContinuationDecision(decision)) return NOT_A_DECISION;
  return followUp(db, actor, id, version, "decision_changed", (before) =>
    withDecision(before, decision),
  );
}
