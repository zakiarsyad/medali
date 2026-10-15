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
} from "./consent-rules";
import { type ConsentView, NO_CONSENT_VERSION } from "./consent-view";
import {
  CHANGED_SINCE,
  PAPER_RECORDED_MESSAGE,
  STUDENT_NOT_FOUND,
  sentToMessage,
} from "./consent-words";

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

export interface Press {
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
  return keptAnswer(tx, press);
}

/**
 * Applies a press to a student's consent, with its log line in the same
 * transaction. The consent is locked first, so of two presses at the
 * same moment the second sees what the first did. A press is refused,
 * changing nothing, when the consent changed since its screen showed it
 * or the move is not allowed from the status it finds.
 */
export function applyPress(
  db: Database,
  press: Press,
): Promise<ConsentOutcome> {
  return db.transaction(async (tx) => {
    const current = await lockConsent(tx, press.studentId);
    if (current === null) return applyFirst(tx, press);
    return applyTo(tx, press, current);
  });
}

/** A version as sent, or null when what was sent is no text. */
export function sentVersion(version: unknown): string | null {
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
