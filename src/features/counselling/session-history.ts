import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { versionOf } from "@/db/row-version";
import {
  accounts,
  counsellingSessionReads,
  counsellingSessions,
} from "@/db/schema";
import type { SessionHistory, SessionView } from "@/mental-health/session-view";
import {
  NEEDS_CONSENT,
  SESSION_NOT_ALLOWED,
} from "@/mental-health/session-words";
import type { Parsed } from "@/parsed";
import { STUDENT_NOT_FOUND } from "./consent-words";
import { holdsConsent, isSessionStudent } from "./session-checks";

/** How many sessions "Riwayat sesi" shows at first, and how many more each time. */
export const SESSIONS_PAGE_SIZE = 10;

/** The most steps of "Tampilkan lebih banyak" read at once. */
const MOST_STEPS = 100;

/**
 * The steps asked, at most MOST_STEPS, or 1 for what is not a whole number
 * of steps.
 */
export function stepsOf(sent: unknown): number {
  const isStep =
    typeof sent === "number" && Number.isInteger(sent) && sent >= 1;
  return isStep ? Math.min(sent, MOST_STEPS) : 1;
}

const writer = alias(accounts, "writer");
const changer = alias(accounts, "changer");

/** The student's latest sessions, the latest day first, with their notes. */
export async function readSessions(
  tx: Database,
  studentId: string,
  limit: number,
): Promise<SessionView[]> {
  const rows = await tx
    .select({
      session: counsellingSessions,
      writerName: writer.name,
      changerName: changer.name,
    })
    .from(counsellingSessions)
    .innerJoin(writer, eq(writer.id, counsellingSessions.writtenBy))
    .innerJoin(changer, eq(changer.id, counsellingSessions.changedBy))
    .where(eq(counsellingSessions.studentId, studentId))
    .orderBy(
      desc(counsellingSessions.day),
      desc(counsellingSessions.writtenAt),
      desc(counsellingSessions.id),
    )
    .limit(limit);
  return rows.map(({ session, writerName, changerName }) => ({
    id: session.id,
    day: session.day,
    kind: session.kind,
    topic: session.topic,
    notes: session.notes,
    followUp: session.followUp,
    nextDay: session.nextDay,
    counsellorName: writerName,
    changed:
      session.changedAt.getTime() === session.writtenAt.getTime()
        ? null
        : { at: session.changedAt, by: changerName },
    version: versionOf(session.changedAt),
  }));
}

/**
 * "Riwayat sesi" of a student: the latest 10 sessions for each step
 * asked, the latest day first. Every Konselor reads every session, also
 * once the consent is withdrawn. Each reading is logged in the same
 * transaction: who, whose notes and when, never the notes. Refused,
 * sending nothing and logging nothing, for any role without the right,
 * for a student not found, and for a student with no session whose
 * consent is not Disetujui: one who never gave it.
 * `studentId` and `steps` come from outside.
 */
export async function readSessionHistory(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
  steps: unknown,
  now: Date = new Date(),
): Promise<Parsed<SessionHistory>> {
  if (!may(actor.roles, "keep_counselling_sessions")) {
    return { ok: false, error: SESSION_NOT_ALLOWED };
  }
  if (!(await isSessionStudent(db, actor, studentId))) {
    return { ok: false, error: STUDENT_NOT_FOUND };
  }
  if (typeof studentId !== "string") {
    return { ok: false, error: STUDENT_NOT_FOUND };
  }
  const limit = stepsOf(steps) * SESSIONS_PAGE_SIZE;
  return db.transaction(async (tx): Promise<Parsed<SessionHistory>> => {
    const read = await readSessions(tx, studentId, limit + 1);
    const hasNoSession = read.length === 0;
    if (hasNoSession && !(await holdsConsent(tx, studentId))) {
      return { ok: false, error: NEEDS_CONSENT };
    }
    await tx
      .insert(counsellingSessionReads)
      .values({ studentId, readBy: actor.id, readAt: now });
    const value = {
      items: read.slice(0, limit),
      hasMore: read.length > limit,
    };
    return { ok: true, value };
  });
}
