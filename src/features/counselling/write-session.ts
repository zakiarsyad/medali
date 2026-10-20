import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { counsellingSessionChanges, counsellingSessions } from "@/db/schema";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { holdsConsent, isSessionStudent } from "./session-checks";
import type { SessionContent } from "./session-ids";
import { checkSession, type SentSession } from "./session-rules";
import {
  NEEDS_CONSENT,
  SESSION_ALREADY_SENT,
  SESSION_NOT_ALLOWED,
  SESSION_SAVED,
} from "./session-words";

/** What "Simpan sesi" gives back. */
export type SessionOutcome =
  | { kind: "kept"; done: string }
  | { kind: "refused"; error: string };

const refused = (error: string): SessionOutcome => ({ kind: "refused", error });

/** Which session a form writes, and for whom. None of it is trusted. */
export interface SessionPress {
  /** The key the form made when it opened. */
  id: unknown;
  studentId: unknown;
}

interface Writing {
  actorId: string;
  id: string;
  studentId: string;
  content: SessionContent;
  now: Date;
}

type StoredSession = typeof counsellingSessions.$inferSelect;

/** What a stored session holds, as its log keeps it. */
export function contentOf(session: StoredSession): SessionContent {
  return {
    day: session.day,
    kind: session.kind,
    topic: session.topic,
    notes: session.notes,
    followUp: session.followUp,
    nextDay: session.nextDay,
  };
}

const CONTENT_KEYS: readonly (keyof SessionContent)[] = [
  "day",
  "kind",
  "topic",
  "notes",
  "followUp",
  "nextDay",
];

/** Whether two contents of a session are the same in every part. */
export function isSameContent(
  one: SessionContent,
  other: SessionContent,
): boolean {
  return CONTENT_KEYS.every((key) => one[key] === other[key]);
}

/**
 * Whether the session kept under the key is the one this form wrote
 * before: by the same account, for the same student, with the same
 * content. A form changed after it was sent is not the same form.
 */
async function isWrittenBefore(
  tx: Database,
  writing: Writing,
): Promise<boolean> {
  const [kept] = await tx
    .select()
    .from(counsellingSessions)
    .where(eq(counsellingSessions.id, writing.id));
  if (!kept) return false;
  return (
    kept.writtenBy === writing.actorId &&
    kept.studentId === writing.studentId &&
    isSameContent(contentOf(kept), writing.content)
  );
}

async function write(tx: Database, writing: Writing): Promise<SessionOutcome> {
  if (!(await holdsConsent(tx, writing.studentId))) {
    return refused(NEEDS_CONSENT);
  }
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(counsellingSessions)
    .values({
      id: writing.id,
      studentId: writing.studentId,
      ...writing.content,
      writtenBy: writing.actorId,
      writtenAt: writing.now,
      changedBy: writing.actorId,
      changedAt: writing.now,
    })
    .onConflictDoNothing()
    .returning({ id: counsellingSessions.id });
  if (added.length === 0) {
    const isSame = await isWrittenBefore(tx, writing);
    return isSame
      ? { kind: "kept", done: SESSION_SAVED }
      : refused(SESSION_ALREADY_SENT);
  }
  await tx.insert(counsellingSessionChanges).values({
    sessionId: writing.id,
    changedBy: writing.actorId,
    changedAt: writing.now,
    step: "write",
    before: null,
    after: writing.content,
  });
  return { kind: "kept", done: SESSION_SAVED };
}

/**
 * "Simpan sesi": keeps a counselling session of a student whose consent
 * is Disetujui, as the work of Konselor, with its log line in the same
 * transaction. Refused, keeping nothing, for any role without the right,
 * for what the rules refuse, for a student not found, and while the
 * consent is not Disetujui. A form sent twice is kept once, and the
 * second press is answered as the first.
 */
export async function writeSession(
  db: Database,
  actor: AccountForAccess,
  press: SessionPress,
  sent: SentSession,
  now: Date = new Date(),
): Promise<SessionOutcome> {
  if (!may(actor.roles, "keep_counselling_sessions")) {
    return refused(SESSION_NOT_ALLOWED);
  }
  const checked = checkSession(sent, campusDay(now));
  if (!checked.ok) return refused(checked.error);
  const { id, studentId } = press;
  if (!(await isSessionStudent(db, actor, studentId))) {
    return refused(STUDENT_NOT_FOUND);
  }
  if (typeof studentId !== "string") return refused(STUDENT_NOT_FOUND);
  if (typeof id !== "string" || !isUuid(id)) {
    return refused(SESSION_ALREADY_SENT);
  }
  const writing = {
    actorId: actor.id,
    id,
    studentId,
    content: checked.value,
    now,
  };
  return db.transaction((tx) => write(tx, writing));
}
