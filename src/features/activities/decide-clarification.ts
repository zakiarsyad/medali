import { and, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  activityClarificationChanges,
  activityClarifications,
  activitySchedules,
} from "@/db/schema";
import { waitForOtherAttendanceWrites } from "./attendance-lock";
import type { AttendanceStatus } from "./attendance-status";
import {
  alreadyAttendedWords,
  CLARIFICATION_DECIDED_BY_OTHER,
  CLARIFICATION_NOT_FOUND,
  type ClarificationAnswer,
  type ClarificationDecision,
  DECIDE_NOT_ALLOWED,
  doneWords,
  parseDecision,
} from "./clarification-decision";
import { acceptedNote } from "./clarification-reasons";
import {
  cardOf,
  OF_CLARIFICATION,
  OF_KEPT_SCHEDULE,
  storedCards,
} from "./clarification-rows";
import { mayDecideClarifications } from "./may-decide-clarifications";
import { holdNewest, replaceNewest, type Target } from "./record-attendance";

/** How a decision on one clarification ended. */
type DecisionEnd =
  | { kind: "decided" | "already-decided" | "not-found" }
  /** Not accepted: the student's attendance already counts, with this status. */
  | { kind: "already-attended"; status: AttendanceStatus };

/** Who decides and when. */
interface Deciding {
  byId: string;
  at: Date;
}

/** A clarification whose schedule is not removed. */
function isKept(clarificationId: string) {
  return and(OF_KEPT_SCHEDULE, eq(activityClarifications.id, clarificationId));
}

/** Whose attendance, at which schedule, a clarification is about. */
async function targetOf(
  db: Database,
  clarificationId: string,
): Promise<Target | undefined> {
  const [target] = await db
    .select({
      studentId: activityClarifications.studentId,
      scheduleId: activityClarifications.scheduleId,
    })
    .from(activityClarifications)
    .innerJoin(activitySchedules, OF_CLARIFICATION)
    .where(isKept(clarificationId));
  return target;
}

/**
 * The clarification as it is stored, held so that nobody else decides it
 * until this decision is saved: a second decision at the same moment
 * waits here, and then finds it decided.
 */
async function holdClarification(db: Database, clarificationId: string) {
  const [held] = await db
    .select({
      status: activityClarifications.status,
      reason: activityClarifications.reason,
    })
    .from(activityClarifications)
    .innerJoin(activitySchedules, OF_CLARIFICATION)
    .where(isKept(clarificationId))
    .for("update", { of: activityClarifications });
  return held;
}

type Held = NonNullable<Awaited<ReturnType<typeof holdClarification>>>;

/**
 * Gives the attendance what an accepted clarification gives it: the
 * student's newest attendance for the schedule becomes Hadir or
 * Dispensasi, also one whose photo still waits, or one is recorded when
 * nothing was sent, with its line in the log of attendance decisions.
 * An attendance that already counts is left as it is, and its status is
 * given back; otherwise null.
 */
async function acceptAttendance(
  tx: Database,
  target: Target,
  held: Held,
  status: "valid" | "dispensation",
  deciding: Deciding,
): Promise<AttendanceStatus | null> {
  const before = await holdNewest(tx, target);
  const counts =
    before?.status === "valid" || before?.status === "dispensation";
  if (before !== undefined && counts) return before.status;
  const record = { status, note: acceptedNote(held.reason) };
  await replaceNewest(tx, before, target, record, deciding);
  return null;
}

function acceptedAs(decision: ClarificationDecision) {
  if (decision.kind === "reject") return null;
  return decision.kind === "present" ? "valid" : "dispensation";
}

/**
 * Writes the decision on a clarification that waits, held by the caller,
 * and its line in the log of clarification decisions.
 */
async function keepDecision(
  tx: Database,
  clarificationId: string,
  decision: ClarificationDecision,
  { byId, at }: Deciding,
): Promise<void> {
  const accepted = acceptedAs(decision);
  const status = accepted === null ? "rejected" : "accepted";
  const { note } = decision;
  await tx
    .update(activityClarifications)
    .set({ status, acceptedAs: accepted, note, decidedAt: at, decidedBy: byId })
    .where(eq(activityClarifications.id, clarificationId));
  await tx.insert(activityClarificationChanges).values({
    clarificationId,
    changedBy: byId,
    changedAt: at,
    statusBefore: "submitted",
    statusAfter: status,
    acceptedAs: accepted,
    note,
  });
}

/**
 * Decides one waiting clarification, changes the attendance when it is
 * accepted, and writes the lines of both logs, all or nothing. It first
 * waits for every other write of this student's attendance for the
 * schedule, so a photo, a record made by hand and an acceptance at the
 * same moment cannot leave two attendances that count. Only a
 * clarification that still waits is decided: the first decision counts.
 * Whether the account may decide is checked by the caller.
 */
function decideOne(
  db: Database,
  clarificationId: string,
  decision: ClarificationDecision,
  deciding: Deciding,
): Promise<DecisionEnd> {
  return db.transaction(async (tx) => {
    const target = await targetOf(tx, clarificationId);
    if (target === undefined) return { kind: "not-found" };
    await waitForOtherAttendanceWrites(tx, target.studentId, target.scheduleId);
    const held = await holdClarification(tx, clarificationId);
    if (held === undefined) return { kind: "not-found" };
    if (held.status !== "submitted") return { kind: "already-decided" };

    const accepted = acceptedAs(decision);
    if (accepted !== null) {
      const has = await acceptAttendance(tx, target, held, accepted, deciding);
      if (has !== null) return { kind: "already-attended", status: has };
    }
    await keepDecision(tx, clarificationId, decision, deciding);
    return { kind: "decided" };
  });
}

function refused(error: string): ClarificationAnswer {
  return { state: { error, done: null }, card: null };
}

/** The card of a clarification as it stands now, or null when there is none. */
async function readCard(db: Database, id: string, keepsFiles: boolean) {
  const [stored] = await storedCards(db, isKept(id));
  return stored === undefined ? null : cardOf(stored, keepsFiles);
}

/**
 * Accepts a clarification as present or as a dispensation, or rejects
 * it, for an account that may decide clarifications; anyone else is
 * refused before anything is read. The answer holds the card as it
 * stands afterwards, also when someone else decided it first, so the
 * screen shows what is true now. `clarificationId`, `kind` and `note`
 * come from outside and are not trusted, and `at` is the moment on the
 * server's clock.
 */
export async function decideClarification(
  db: Database,
  account: AccountForAccess,
  sent: { clarificationId: unknown; kind: unknown; note: unknown },
  at: Date,
  keepsFiles: boolean,
): Promise<ClarificationAnswer> {
  if (!mayDecideClarifications(account)) return refused(DECIDE_NOT_ALLOWED);
  const { clarificationId } = sent;
  if (typeof clarificationId !== "string" || !isUuid(clarificationId)) {
    return refused(CLARIFICATION_NOT_FOUND);
  }
  const decision = parseDecision(sent.kind, sent.note);
  if (!decision.ok) return refused(decision.error);

  const end = await decideOne(db, clarificationId, decision.value, {
    byId: account.id,
    at,
  });
  if (end.kind === "not-found") return refused(CLARIFICATION_NOT_FOUND);
  const card = await readCard(db, clarificationId, keepsFiles);
  if (end.kind === "already-decided") {
    return {
      state: { error: CLARIFICATION_DECIDED_BY_OTHER, done: null },
      card,
    };
  }
  if (end.kind === "already-attended") {
    return {
      state: { error: alreadyAttendedWords(end.status), done: null },
      card,
    };
  }
  return {
    state: { error: null, done: doneWords(decision.value.kind) },
    card,
  };
}
