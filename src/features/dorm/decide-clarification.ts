import { and, eq } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Action } from "@/auth/roles";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormClarificationChanges, dormClarifications } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import {
  type CheckedDecision,
  CLARIFICATION_NOT_FOUND,
  type ClarificationStep,
  DECIDE_NOT_ALLOWED,
  DECIDED_FIRST,
  parseDecision,
  STILL_WAITS_FOR_BAM,
  statusAfterStep,
  VERIFY_NOT_ALLOWED,
} from "./clarification-decision";
import type { AcceptedAs, DormClarificationStatus } from "./clarification-ids";
import type { Decided } from "./leave-messages";
import { isOwnRecord, OWN_RECORD } from "./own-record";

type Decider = Pick<Account, "id" | "roles" | "studentId">;

/** The right each step needs, and what is said to an account without it. */
const STEP_RIGHTS: Record<
  ClarificationStep,
  { action: Action; refusal: { ok: false; error: string } }
> = {
  verify: { action: "verify_dorm_clarification", refusal: VERIFY_NOT_ALLOWED },
  decide: { action: "decide_dorm_clarification", refusal: DECIDE_NOT_ALLOWED },
};

/** The status a clarification must have for each step. */
const WAITS_FOR: Record<ClarificationStep, DormClarificationStatus> = {
  verify: "submitted",
  decide: "verified",
};

/** What a step makes of a clarification, and what it writes on it. */
interface StepChanges {
  status: DormClarificationStatus;
  acceptedAs: AcceptedAs | null;
  set: PgUpdateSetSource<typeof dormClarifications>;
}

/** What a step writes on the clarification: who, when, the note and the status. */
function changesOf(
  step: ClarificationStep,
  decision: CheckedDecision,
  actorId: string,
): StepChanges {
  const status = statusAfterStep(step, decision.kind);
  if (step === "verify") {
    const set = {
      status,
      verifiedBy: actorId,
      verifiedAt: WRITTEN_NOW,
      verifyNote: decision.note,
    };
    return { status, acceptedAs: null, set };
  }
  const { kind } = decision;
  const acceptedAs = kind === "present" || kind === "leave" ? kind : null;
  const set = {
    status,
    acceptedAs,
    decidedBy: actorId,
    decidedAt: WRITTEN_NOW,
    decisionNote: decision.note,
  };
  return { status, acceptedAs, set };
}

/** Where a clarification stands now, or null when there is none. */
async function statusOf(
  db: Database,
  id: string,
): Promise<DormClarificationStatus | null> {
  const [kept] = await db
    .select({ status: dormClarifications.status })
    .from(dormClarifications)
    .where(eq(dormClarifications.id, id));
  return kept?.status ?? null;
}

/** Whether a clarification is of the account's own student. */
async function isOwnClarification(
  db: Database,
  actor: Decider,
  id: string,
): Promise<boolean> {
  if (actor.studentId === null) return false;
  const [kept] = await db
    .select({ studentId: dormClarifications.studentId })
    .from(dormClarifications)
    .where(eq(dormClarifications.id, id));
  if (kept === undefined) return false;
  return isOwnRecord(actor.studentId, kept.studentId);
}

async function decideIn(
  tx: Database,
  actor: Decider,
  step: ClarificationStep,
  id: string,
  decision: CheckedDecision,
): Promise<Decided<DormClarificationStatus>> {
  const before = WAITS_FOR[step];
  const changes = changesOf(step, decision, actor.id);
  const [decided] = await tx
    .update(dormClarifications)
    .set(changes.set)
    .where(
      and(eq(dormClarifications.id, id), eq(dormClarifications.status, before)),
    )
    .returning({
      verifiedAt: dormClarifications.verifiedAt,
      decidedAt: dormClarifications.decidedAt,
    });
  if (decided === undefined) {
    const kept = await statusOf(tx, id);
    if (kept === null) return CLARIFICATION_NOT_FOUND;
    if (step === "decide" && kept === "submitted") return STILL_WAITS_FOR_BAM;
    return DECIDED_FIRST;
  }
  const at = step === "verify" ? decided.verifiedAt : decided.decidedAt;
  await tx.insert(dormClarificationChanges).values({
    clarificationId: id,
    changedBy: actor.id,
    changedAt: at ?? undefined,
    statusBefore: before,
    statusAfter: changes.status,
    acceptedAs: changes.acceptedAs,
    note: decision.note,
  });
  return { ok: true, value: changes.status };
}

/**
 * A check of BAM - BPHK or BAM - KI ("Terima, teruskan ke pengelola" or
 * "Tolak klarifikasi"), or a decision of Pengelola Asrama ("Terima
 * sebagai hadir", "Terima sebagai izin" or "Tolak"), with its Catatan,
 * and its line in the log, all or nothing. Each step is refused to a
 * role without its right: Pengelola Asrama does not check in BAM's
 * place, BAM does not decide, and a role that only reads does neither.
 * BAM's check of the account's own clarification is refused. The database changes a clarification only while it waits for that
 * step, so of two decisions at once the second waits for the first,
 * then is refused. One that still waits for BAM says so to Pengelola.
 * An accepted one makes the resident Hadir or Izin at the activity from
 * then on, where every attendance is read. `id`, `kind` and `note` come
 * from outside and are not trusted.
 */
export async function decideDormClarification(
  db: Database,
  actor: Decider,
  step: ClarificationStep,
  sent: { id: string; kind: unknown; note: unknown },
): Promise<Decided<DormClarificationStatus>> {
  const right = STEP_RIGHTS[step];
  if (!may(actor.roles, right.action)) return right.refusal;
  if (!isUuid(sent.id)) return CLARIFICATION_NOT_FOUND;
  const decision = parseDecision(step, sent.kind, sent.note);
  if (!decision.ok) return decision;
  if (step === "verify" && (await isOwnClarification(db, actor, sent.id))) {
    return OWN_RECORD;
  }
  return db.transaction((tx) =>
    decideIn(tx, actor, step, sent.id, decision.value),
  );
}
