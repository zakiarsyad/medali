import { eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { versionOf } from "@/db/row-version";
import { counsellingConsentChanges, counsellingConsents } from "@/db/schema";
import type { ConsentStatus } from "./consent-ids";
import { pickableStudentName } from "./consent-picks";
import { readConsentOf } from "./consent-reads";
import {
  type ConsentMove,
  type ConsentState,
  type CounsellorMove,
  consentAfter,
  type StudentMove,
} from "./consent-rules";
import {
  type ConsentView,
  NO_CONSENT_VERSION,
  withoutCounsellor,
} from "./consent-view";
import {
  APPROVED_MESSAGE,
  CHANGED_SINCE,
  DECLINED_MESSAGE,
  PAPER_RECORDED_MESSAGE,
  STUDENT_NOT_FOUND,
  sentToMessage,
  WITHDRAWN_MESSAGE,
} from "./consent-words";
import { stopSharingWithConsent } from "./press-sharing";

/**
 * What a press on a consent gives back. A kept change, and a press
 * refused because the consent changed since the screen showed it, both
 * give the consent as it is now, so the person sees the current status.
 * Any other refusal gives nothing back.
 */
export type ConsentOutcome =
  | { kind: "kept"; done: string; consent: ConsentView }
  | { kind: "changed"; error: string; consent: ConsentView | null }
  | { kind: "refused"; error: string };

export const NOT_ALLOWED = {
  kind: "refused",
  error: "Anda tidak memiliki hak untuk mengubah persetujuan ini.",
} as const;

const NOT_FOUND = { kind: "refused", error: STUDENT_NOT_FOUND } as const;

interface Press {
  actorId: string;
  studentId: string;
  move: ConsentMove;
  /**
   * The version of the consent the screen showed when it was pressed;
   * null when what was sent is no text at all.
   */
  version: string | null;
  /** What the message says once the change is kept. */
  done: string;
  now: Date;
}

interface Kept {
  id: string;
  status: ConsentStatus;
  changedAt: Date;
}

async function lockConsent(
  tx: Database,
  studentId: string,
): Promise<Kept | null> {
  const [kept] = await tx
    .select({
      id: counsellingConsents.id,
      status: counsellingConsents.status,
      changedAt: counsellingConsents.changedAt,
    })
    .from(counsellingConsents)
    .where(eq(counsellingConsents.studentId, studentId))
    .for("update");
  return kept ?? null;
}

async function refusedAsChanged(
  tx: Database,
  studentId: string,
): Promise<ConsentOutcome> {
  return {
    kind: "changed",
    error: CHANGED_SINCE,
    consent: await readConsentOf(tx, studentId),
  };
}

/**
 * The first consent of a student. Two first presses at the same moment
 * both find none; the one-per-student rule keeps only one, and the other
 * gets back no row.
 */
async function addConsent(
  tx: Database,
  press: Press,
  after: ConsentState,
): Promise<string | null> {
  const [added] = await tx
    .insert(counsellingConsents)
    .values({
      studentId: press.studentId,
      ...after,
      changedBy: press.actorId,
      changedAt: press.now,
    })
    .onConflictDoNothing({ target: counsellingConsents.studentId })
    .returning({ id: counsellingConsents.id });
  return added?.id ?? null;
}

async function logChange(
  tx: Database,
  press: Press,
  consentId: string,
  before: ConsentStatus | null,
  after: ConsentState,
): Promise<void> {
  await tx.insert(counsellingConsentChanges).values({
    consentId,
    changedBy: press.actorId,
    changedAt: press.now,
    statusBefore: before,
    statusAfter: after.status,
    way: after.way,
  });
}

async function keptAnswer(tx: Database, press: Press): Promise<ConsentOutcome> {
  const consent = await readConsentOf(tx, press.studentId);
  if (consent === null) throw new Error("A kept consent was not found.");
  return { kind: "kept", done: press.done, consent };
}

async function applyFirst(tx: Database, press: Press): Promise<ConsentOutcome> {
  const after = consentAfter(press.move, null);
  if (press.version !== NO_CONSENT_VERSION || after === null) {
    return refusedAsChanged(tx, press.studentId);
  }
  const id = await addConsent(tx, press, after);
  if (id === null) return refusedAsChanged(tx, press.studentId);
  await logChange(tx, press, id, null, after);
  return keptAnswer(tx, press);
}

async function applyTo(
  tx: Database,
  press: Press,
  current: Kept,
): Promise<ConsentOutcome> {
  const after = consentAfter(press.move, current.status);
  const isAsShown = versionOf(current.changedAt) === press.version;
  if (!isAsShown || after === null) {
    return refusedAsChanged(tx, press.studentId);
  }
  await tx
    .update(counsellingConsents)
    .set({ ...after, changedBy: press.actorId, changedAt: press.now })
    .where(eq(counsellingConsents.id, current.id));
  await logChange(tx, press, current.id, current.status, after);
  if (after.status === "withdrawn") {
    await stopSharingWithConsent(tx, press.actorId, press.studentId, press.now);
  }
  return keptAnswer(tx, press);
}

/**
 * Applies a press to a student's consent, with its log line in the same
 * transaction. The consent is locked first, so of two presses at the
 * same moment the second sees what the first did. A press is refused,
 * changing nothing, when the consent changed since its screen showed it
 * or the move is not allowed from the status it finds.
 */
function applyPress(db: Database, press: Press): Promise<ConsentOutcome> {
  return db.transaction(async (tx) => {
    const current = await lockConsent(tx, press.studentId);
    if (current === null) return applyFirst(tx, press);
    return applyTo(tx, press, current);
  });
}

/**
 * Registering for voluntary counselling with the tick: a consent that is
 * not Disetujui becomes Disetujui by registration, with its log line, in
 * the transaction of the registration. A first consent that Konselor
 * adds at the same moment is found once it is kept, and changed then.
 */
export async function consentByRegistration(
  tx: Database,
  actorId: string,
  studentId: string,
  now: Date,
): Promise<void> {
  const press: Press = {
    actorId,
    studentId,
    move: "register",
    version: null,
    done: "",
    now,
  };
  let current = await lockConsent(tx, studentId);
  if (current === null) {
    const first = consentAfter("register", null);
    if (first === null) throw new Error("Registering gives no consent.");
    const id = await addConsent(tx, press, first);
    if (id !== null) return logChange(tx, press, id, null, first);
    current = await lockConsent(tx, studentId);
    if (current === null) throw new Error("A consent was not found.");
  }
  const after = consentAfter("register", current.status);
  if (after === null) return;
  await tx
    .update(counsellingConsents)
    .set({ ...after, changedBy: actorId, changedAt: now })
    .where(eq(counsellingConsents.id, current.id));
  await logChange(tx, press, current.id, current.status, after);
}

/** A version as sent, or null when what was sent is no text. */
function sentVersion(version: unknown): string | null {
  return typeof version === "string" ? version : null;
}

/**
 * "Kirim permintaan persetujuan" or "Catat form tertulis" for any
 * student who is not removed, by Konselor. `version` is the consent the
 * panel showed. Refused for any role without the right, giving nothing
 * back.
 */
export async function changeConsentAsCounsellor(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
  move: CounsellorMove,
  version: unknown,
  now: Date = new Date(),
): Promise<ConsentOutcome> {
  if (!may(actor.roles, "manage_counselling_consent")) return NOT_ALLOWED;
  const name = await pickableStudentName(db, actor, studentId);
  if (name === null || typeof studentId !== "string") return NOT_FOUND;
  const done = move === "ask" ? sentToMessage(name) : PAPER_RECORDED_MESSAGE;
  return applyPress(db, {
    actorId: actor.id,
    studentId,
    move,
    version: sentVersion(version),
    done,
    now,
  });
}

const STUDENT_MESSAGES: Record<StudentMove, string> = {
  approve: APPROVED_MESSAGE,
  decline: DECLINED_MESSAGE,
  withdraw: WITHDRAWN_MESSAGE,
};

/** An outcome as the student sees it: without the Konselor's name. */
function asStudentSees(outcome: ConsentOutcome): ConsentOutcome {
  if (outcome.kind === "refused" || outcome.consent === null) return outcome;
  return { ...outcome, consent: withoutCounsellor(outcome.consent) };
}

/**
 * "Setujui", "Tolak" or "Cabut persetujuan" on the student's own
 * consent. The student is the signed-in account's own, never one that
 * was sent, so nobody answers for another student. `version` is the
 * consent the student's page showed. Refused for any role without the
 * right, giving nothing back.
 */
export async function changeOwnConsent(
  db: Database,
  actor: AccountForAccess,
  move: StudentMove,
  version: unknown,
  now: Date = new Date(),
): Promise<ConsentOutcome> {
  if (!may(actor.roles, "answer_own_counselling_consent")) return NOT_ALLOWED;
  if (actor.studentId === null) return NOT_ALLOWED;
  const outcome = await applyPress(db, {
    actorId: actor.id,
    studentId: actor.studentId,
    move,
    version: sentVersion(version),
    done: STUDENT_MESSAGES[move],
    now,
  });
  return asStudentSees(outcome);
}
