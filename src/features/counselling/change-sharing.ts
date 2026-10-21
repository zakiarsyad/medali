import { and, eq, inArray } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  counsellingConsents,
  counsellingSharingChanges,
  counsellingSharings,
} from "@/db/schema";
import type { ConsentStatus } from "./consent-ids";
import { STUDENT_NOT_FOUND } from "./consent-words";
import {
  CURRENT_SHARING_STATUSES,
  type SharingContent,
  type SharingStatus,
  type SharingStep,
} from "./sharing-ids";
import { readSharingInput } from "./sharing-input";
import {
  hasSessions,
  readLatestSharing,
  sharingStudentName,
} from "./sharing-reads";
import { sharingAfter } from "./sharing-rules";
import type { SharingView } from "./sharing-view";
import {
  askedMessage,
  NEEDS_COUNSELLING_CONSENT,
  NO_SESSION,
  SHARING_CHANGED,
  SHARING_NOT_ALLOWED,
} from "./sharing-words";

/**
 * What a press on a sharing gives back. A kept change, and a press
 * refused because the sharing changed since the screen showed it, both
 * give the sharing as it is now, so the person sees the current status.
 * Any other refusal gives nothing back.
 */
export type SharingOutcome =
  | { kind: "kept"; done: string; sharing: SharingView | null }
  | { kind: "changed"; error: string; sharing: SharingView | null }
  | { kind: "refused"; error: string };

export const NOT_ALLOWED = {
  kind: "refused",
  error: SHARING_NOT_ALLOWED,
} as const;

const NOT_FOUND = { kind: "refused", error: STUDENT_NOT_FOUND } as const;

/** A sharing as it is locked for a change. */
interface Locked {
  id: string;
  status: SharingStatus;
  content: SharingContent;
  changedAt: Date;
}

interface LogStep {
  sharingId: string;
  actorId: string;
  now: Date;
  step: SharingStep;
  before: SharingStatus | null;
  after: SharingStatus;
  shared: SharingContent;
}

/**
 * Locks the student's consent to counselling first, as its withdrawal
 * does before it stops the sharing: every change of a sharing and every
 * change of the consent wait for each other in the same order, so a
 * sharing is never kept beside a consent withdrawn at the same moment.
 */
export async function lockConsentStatus(
  tx: Database,
  studentId: string,
): Promise<ConsentStatus | null> {
  const [found] = await tx
    .select({ status: counsellingConsents.status })
    .from(counsellingConsents)
    .where(eq(counsellingConsents.studentId, studentId))
    .for("update");
  return found?.status ?? null;
}

const LOCKED_FIELDS = {
  id: counsellingSharings.id,
  status: counsellingSharings.status,
  data: counsellingSharings.data,
  recipients: counsellingSharings.recipients,
  summary: counsellingSharings.summary,
  changedAt: counsellingSharings.changedAt,
};

function lockedOf(found: {
  id: string;
  status: SharingStatus;
  data: SharingContent["data"];
  recipients: SharingContent["recipients"];
  summary: string | null;
  changedAt: Date;
}): Locked {
  const { data, recipients, summary, ...rest } = found;
  return { ...rest, content: { data, recipients, summary } };
}

/** The student's current sharing, locked, or null when none is current. */
export async function lockCurrentSharing(
  tx: Database,
  studentId: string,
): Promise<Locked | null> {
  const [found] = await tx
    .select(LOCKED_FIELDS)
    .from(counsellingSharings)
    .where(
      and(
        eq(counsellingSharings.studentId, studentId),
        inArray(counsellingSharings.status, CURRENT_SHARING_STATUSES),
      ),
    )
    .for("update");
  return found ? lockedOf(found) : null;
}

/** One sharing of the student, locked, or null when it is not theirs. */
export async function lockSharing(
  tx: Database,
  studentId: string,
  sharingId: string,
): Promise<Locked | null> {
  const [found] = await tx
    .select(LOCKED_FIELDS)
    .from(counsellingSharings)
    .where(
      and(
        eq(counsellingSharings.id, sharingId),
        eq(counsellingSharings.studentId, studentId),
      ),
    )
    .for("update");
  return found ? lockedOf(found) : null;
}

export async function logSharingStep(
  tx: Database,
  line: LogStep,
): Promise<void> {
  await tx.insert(counsellingSharingChanges).values({
    sharingId: line.sharingId,
    changedBy: line.actorId,
    changedAt: line.now,
    step: line.step,
    statusBefore: line.before,
    statusAfter: line.after,
    shared: line.shared,
  });
}

export async function changedSince(
  tx: Database,
  studentId: string,
): Promise<SharingOutcome> {
  return {
    kind: "changed",
    error: SHARING_CHANGED,
    sharing: await readLatestSharing(tx, studentId),
  };
}

interface Ask {
  actorId: string;
  studentId: string;
  content: SharingContent;
  done: string;
  now: Date;
}

/**
 * A new request, in one transaction with its log line. The consent is
 * locked first, so two requests at the same moment wait for each other
 * and the second finds the first one current.
 */
function addRequest(db: Database, ask: Ask): Promise<SharingOutcome> {
  return db.transaction(async (tx) => {
    const consent = await lockConsentStatus(tx, ask.studentId);
    if (consent !== "approved") {
      return { kind: "refused", error: NEEDS_COUNSELLING_CONSENT };
    }
    if (!(await hasSessions(tx, ask.studentId))) {
      return { kind: "refused", error: NO_SESSION };
    }
    const after = sharingAfter("ask", null);
    const current = await lockCurrentSharing(tx, ask.studentId);
    if (current !== null || after === null) {
      return changedSince(tx, ask.studentId);
    }
    const [added] = await tx
      .insert(counsellingSharings)
      .values({
        studentId: ask.studentId,
        status: after,
        ...ask.content,
        askedBy: ask.actorId,
        askedAt: ask.now,
        changedBy: ask.actorId,
        changedAt: ask.now,
      })
      .returning({ id: counsellingSharings.id });
    if (!added) throw new Error("A sharing was not added.");
    await logSharingStep(tx, {
      sharingId: added.id,
      actorId: ask.actorId,
      now: ask.now,
      step: "ask",
      before: null,
      after,
      shared: ask.content,
    });
    const sharing = await readLatestSharing(tx, ask.studentId);
    return { kind: "kept", done: ask.done, sharing };
  });
}

/**
 * "Minta persetujuan mahasiswa" for any student who is not removed, by
 * Konselor: only while the student's consent to counselling is
 * Disetujui, after at least one session, and while no sharing of theirs
 * is current. What was sent comes from outside. Refused for any role
 * without the right, giving nothing back.
 */
export async function askSharing(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
  sent: { data: unknown; recipients: unknown; summary: unknown },
  now: Date = new Date(),
): Promise<SharingOutcome> {
  if (!may(actor.roles, "share_counselling_data")) return NOT_ALLOWED;
  const name = await sharingStudentName(db, actor, studentId);
  if (name === null || typeof studentId !== "string") return NOT_FOUND;
  const content = readSharingInput(sent.data, sent.recipients, sent.summary);
  if (!content.ok) return { kind: "refused", error: content.error };
  return addRequest(db, {
    actorId: actor.id,
    studentId,
    content: content.value,
    done: askedMessage(name),
    now,
  });
}
