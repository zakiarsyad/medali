import { eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { versionOf } from "@/db/row-version";
import { counsellingSharings } from "@/db/schema";
import type { SharingStatus } from "@/mental-health/sharing-ids";
import {
  STUDENT_APPROVED_MESSAGE,
  STUDENT_DECLINED_MESSAGE,
  STUDENT_WITHDRAWN_MESSAGE,
} from "@/mental-health/sharing-words";
import {
  changedSince,
  lockConsentStatus,
  lockCurrentSharing,
  lockSharing,
  logSharingStep,
  NOT_ALLOWED,
  type SharingOutcome,
} from "./change-sharing";
import { readCurrentSharing, readLatestSharing } from "./sharing-reads";
import {
  isStop,
  type SharingMove,
  type StudentSharingMove,
  sharingAfter,
  wayOf,
} from "./sharing-rules";
import { withoutPublisher } from "./sharing-view";

/** A press on one sharing the screen showed. */
export interface SharingPress {
  actorId: string;
  studentId: string;
  move: SharingMove;
  /** The sharing the screen showed; it comes from outside. */
  sharingId: unknown;
  /** Its version as the screen showed it; it comes from outside. */
  version: unknown;
  /** What the message says once the change is kept, by the status before. */
  doneAfter: (before: SharingStatus) => string;
  now: Date;
}

/** What a move sets beside the status, and the changer and moment. */
function stepFields(
  move: SharingMove,
  actorId: string,
  now: Date,
): Partial<typeof counsellingSharings.$inferInsert> {
  const fields: Partial<typeof counsellingSharings.$inferInsert> = {
    changedBy: actorId,
    changedAt: now,
  };
  const way = wayOf(move);
  if (way !== null) fields.way = way;
  if (way !== null || move === "decline") fields.answeredAt = now;
  if (move === "publish") {
    fields.publishedBy = actorId;
    fields.publishedAt = now;
  }
  return fields;
}

/**
 * Applies a press to the sharing the screen showed, with its log line,
 * in one transaction. The consent is locked first, then the sharing, so
 * of two presses at the same moment the second sees what the first did.
 * A stop is kept on the same sharing whatever changed since, as long as
 * the stop is still allowed, so stopping always wins. Any other press is
 * refused, changing nothing, when the sharing changed since its screen
 * showed it or the move is not allowed from the status it finds.
 */
export function applySharingPress(
  db: Database,
  press: SharingPress,
): Promise<SharingOutcome> {
  return db.transaction(async (tx) => {
    await lockConsentStatus(tx, press.studentId);
    const { sharingId } = press;
    if (typeof sharingId !== "string" || !isUuid(sharingId)) {
      return changedSince(tx, press.studentId);
    }
    const current = await lockSharing(tx, press.studentId, sharingId);
    if (current === null) return changedSince(tx, press.studentId);
    const after = sharingAfter(press.move, current.status);
    const isAsShown = versionOf(current.changedAt) === press.version;
    if (after === null || !(isAsShown || isStop(press.move))) {
      return changedSince(tx, press.studentId);
    }
    await tx
      .update(counsellingSharings)
      .set({
        status: after,
        ...stepFields(press.move, press.actorId, press.now),
      })
      .where(eq(counsellingSharings.id, current.id));
    await logSharingStep(tx, {
      sharingId: current.id,
      actorId: press.actorId,
      now: press.now,
      step: press.move,
      before: current.status,
      after,
      shared: current.content,
    });
    const sharing = await readLatestSharing(tx, press.studentId);
    const done = press.doneAfter(current.status);
    return { kind: "kept", done, sharing };
  });
}

const STUDENT_MESSAGES: Record<StudentSharingMove, string> = {
  approve: STUDENT_APPROVED_MESSAGE,
  decline: STUDENT_DECLINED_MESSAGE,
  withdraw: STUDENT_WITHDRAWN_MESSAGE,
};

/**
 * The student sees only their current sharing, without the name of the
 * Konselor who published it.
 */
async function asStudentSees(
  db: Database,
  studentId: string,
  outcome: SharingOutcome,
): Promise<SharingOutcome> {
  if (outcome.kind === "refused") return outcome;
  const current = await readCurrentSharing(db, studentId);
  return {
    ...outcome,
    sharing: current === null ? null : withoutPublisher(current),
  };
}

/**
 * "Setujui berbagi data", "Tolak" or "Cabut persetujuan berbagi" on the
 * student's own sharing. The student is the signed-in account's own,
 * never one that was sent, so a sharing of another student is never
 * found. Refused for any role without the right, giving nothing back.
 */
export async function changeOwnSharing(
  db: Database,
  actor: AccountForAccess,
  move: StudentSharingMove,
  sharingId: unknown,
  version: unknown,
  now: Date = new Date(),
): Promise<SharingOutcome> {
  if (!may(actor.roles, "answer_own_counselling_sharing")) return NOT_ALLOWED;
  if (actor.studentId === null) return NOT_ALLOWED;
  const outcome = await applySharingPress(db, {
    actorId: actor.id,
    studentId: actor.studentId,
    move,
    sharingId,
    version,
    doneAfter: () => STUDENT_MESSAGES[move],
    now,
  });
  return asStudentSees(db, actor.studentId, outcome);
}

/**
 * The student's current sharing becomes Dicabut, with its log line, in
 * the transaction where they withdraw their consent to counselling,
 * which holds the consent locked. Nothing for a student with none.
 */
export async function stopSharingWithConsent(
  tx: Database,
  actorId: string,
  studentId: string,
  now: Date,
): Promise<void> {
  const current = await lockCurrentSharing(tx, studentId);
  if (current === null) return;
  const after = sharingAfter("consent_withdrawn", current.status);
  if (after === null) return;
  await tx
    .update(counsellingSharings)
    .set({ status: after, changedBy: actorId, changedAt: now })
    .where(eq(counsellingSharings.id, current.id));
  await logSharingStep(tx, {
    sharingId: current.id,
    actorId,
    now,
    step: "consent_withdrawn",
    before: current.status,
    after,
    shared: current.content,
  });
}
