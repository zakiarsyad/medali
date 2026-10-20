import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  counsellingSchedules,
  counsellingSessionChanges,
  counsellingSessions,
} from "@/db/schema";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { holdsConsent, isSessionStudent } from "./session-checks";
import { contentOf, isSameContent } from "./session-content";
import type { SessionContent } from "./session-ids";
import { checkSession, type SentSession } from "./session-rules";
import {
  NEEDS_CONSENT,
  SCHEDULE_HAS_SESSION,
  SCHEDULE_NOT_DONE,
  SESSION_ALREADY_SENT,
  SESSION_NOT_ALLOWED,
  SESSION_SAVED,
} from "./session-words";

/** What "Simpan sesi" gives back. */
export type SessionOutcome =
  | { kind: "kept"; done: string }
  | { kind: "refused"; error: string };

const refused = (error: string): SessionOutcome => ({ kind: "refused", error });

const KEPT: SessionOutcome = { kind: "kept", done: SESSION_SAVED };

/** Which session a form writes, and for whom. None of it is trusted. */
export interface SessionPress {
  /** The key the form made when it opened. */
  id: unknown;
  studentId: unknown;
  /** The schedule marked Selesai it is written for; empty for none. */
  scheduleId?: unknown;
}

interface Writing {
  actorId: string;
  id: string;
  studentId: string;
  scheduleId: string | null;
  content: SessionContent;
  now: Date;
}

/** The schedule sent: null for none, false for what is no key. */
function sentSchedule(sent: unknown): string | null | false {
  if (sent === undefined || sent === null || sent === "") return null;
  return typeof sent === "string" && isUuid(sent) ? sent : false;
}

/** Whether the schedule is Selesai, and the student's own. */
async function isDoneScheduleOf(
  tx: Database,
  scheduleId: string,
  studentId: string,
): Promise<boolean> {
  const [found] = await tx
    .select({ id: counsellingSchedules.id })
    .from(counsellingSchedules)
    .where(
      and(
        eq(counsellingSchedules.id, scheduleId),
        eq(counsellingSchedules.studentId, studentId),
        eq(counsellingSchedules.status, "done"),
      ),
    );
  return found !== undefined;
}

/**
 * Why nothing was added: the same form sent before is answered as the
 * first time; another form for a schedule that has its session, or the
 * same form changed after it was sent, is refused.
 */
async function answerNotAdded(
  tx: Database,
  writing: Writing,
): Promise<SessionOutcome> {
  const [kept] = await tx
    .select()
    .from(counsellingSessions)
    .where(eq(counsellingSessions.id, writing.id));
  if (!kept) return refused(SCHEDULE_HAS_SESSION);
  const isSame =
    kept.writtenBy === writing.actorId &&
    kept.studentId === writing.studentId &&
    kept.scheduleId === writing.scheduleId &&
    isSameContent(contentOf(kept), writing.content);
  return isSame ? KEPT : refused(SESSION_ALREADY_SENT);
}

async function write(tx: Database, writing: Writing): Promise<SessionOutcome> {
  if (!(await holdsConsent(tx, writing.studentId))) {
    return refused(NEEDS_CONSENT);
  }
  const { scheduleId } = writing;
  if (scheduleId !== null) {
    const isDone = await isDoneScheduleOf(tx, scheduleId, writing.studentId);
    if (!isDone) return refused(SCHEDULE_NOT_DONE);
  }
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(counsellingSessions)
    .values({
      id: writing.id,
      studentId: writing.studentId,
      scheduleId,
      ...writing.content,
      writtenBy: writing.actorId,
      writtenAt: writing.now,
      changedBy: writing.actorId,
      changedAt: writing.now,
    })
    .onConflictDoNothing()
    .returning({ id: counsellingSessions.id });
  if (added.length === 0) return answerNotAdded(tx, writing);
  await tx.insert(counsellingSessionChanges).values({
    sessionId: writing.id,
    changedBy: writing.actorId,
    changedAt: writing.now,
    step: "write",
    before: null,
    after: writing.content,
  });
  return KEPT;
}

/**
 * "Simpan sesi": keeps a counselling session of a student whose consent
 * is Disetujui, as the work of Konselor, with its log line in the same
 * transaction, and for the schedule marked Selesai it was opened from,
 * when it was. Refused, keeping nothing, for any role without the right,
 * for what the rules refuse, for a student not found, while the consent
 * is not Disetujui, and for a schedule that is not the student's,
 * not Selesai, or has its session. A form sent twice is kept once, and
 * the second press is answered as the first.
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
  const scheduleId = sentSchedule(press.scheduleId);
  if (scheduleId === false) return refused(SCHEDULE_NOT_DONE);
  const writing = {
    actorId: actor.id,
    id,
    studentId,
    scheduleId,
    content: checked.value,
    now,
  };
  return db.transaction((tx) => write(tx, writing));
}
