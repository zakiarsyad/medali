import { and, eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { versionOf } from "@/db/row-version";
import {
  counsellingSessionChanges,
  counsellingSessions,
  students,
} from "@/db/schema";
import type { SessionContent } from "@/mental-health/session-ids";
import {
  NEEDS_CONSENT,
  SESSION_CHANGED,
  SESSION_CHANGED_SINCE,
  SESSION_NOT_ALLOWED,
  SESSION_NOT_FOUND,
} from "@/mental-health/session-words";
import { holdsConsent } from "./session-checks";
import { contentOf } from "./session-content";
import { checkSession, type SentSession } from "./session-rules";

/**
 * What "Simpan perubahan" gives back. A session that changed since its
 * form opened is refused apart, so the screen reads it again and shows
 * the latest version.
 */
export type ChangeOutcome =
  | { kind: "kept"; done: string }
  | { kind: "changed"; error: string }
  | { kind: "refused"; error: string };

const refused = (error: string): ChangeOutcome => ({ kind: "refused", error });

interface Change {
  actor: AccountForAccess;
  id: string;
  version: unknown;
  content: SessionContent;
  now: Date;
}

/** Locks the session, when it is of a student Konselor may keep sessions of. */
async function lockSession(tx: Database, change: Change) {
  const scope = visibleTo(
    rowLimitForAction(change.actor, "keep_counselling_sessions"),
  );
  const [kept] = await tx
    .select({ session: counsellingSessions })
    .from(counsellingSessions)
    .innerJoin(students, eq(students.id, counsellingSessions.studentId))
    .where(and(eq(counsellingSessions.id, change.id), scope))
    .for("update", { of: counsellingSessions });
  return kept?.session ?? null;
}

async function apply(tx: Database, change: Change): Promise<ChangeOutcome> {
  const current = await lockSession(tx, change);
  if (current === null) return refused(SESSION_NOT_FOUND);
  if (!(await holdsConsent(tx, current.studentId))) {
    return refused(NEEDS_CONSENT);
  }
  if (versionOf(current.changedAt) !== change.version) {
    return { kind: "changed", error: SESSION_CHANGED_SINCE };
  }
  const { actor, content, now } = change;
  await tx
    .update(counsellingSessions)
    .set({ ...content, changedBy: actor.id, changedAt: now })
    .where(eq(counsellingSessions.id, current.id));
  await tx.insert(counsellingSessionChanges).values({
    sessionId: current.id,
    changedBy: actor.id,
    changedAt: now,
    step: "change",
    before: contentOf(current),
    after: content,
  });
  return { kind: "kept", done: SESSION_CHANGED };
}

/**
 * "Simpan perubahan" of "Ubah" on a session: it holds the new content as
 * the work of the Konselor who changed it, with a log line of before and
 * after in the same transaction. The session is locked first, so of two
 * changes at the same moment the second sees the first and is refused.
 * Refused, changing nothing, for any role without the right, for what
 * the rules refuse, for a session not found, while the consent is not
 * Disetujui, and when it changed since its form opened. `version` is the
 * session the form showed. A session is never erased.
 */
export async function changeSession(
  db: Database,
  actor: AccountForAccess,
  id: unknown,
  version: unknown,
  sent: SentSession,
  now: Date = new Date(),
): Promise<ChangeOutcome> {
  if (!may(actor.roles, "keep_counselling_sessions")) {
    return refused(SESSION_NOT_ALLOWED);
  }
  if (typeof id !== "string" || !isUuid(id)) return refused(SESSION_NOT_FOUND);
  const checked = checkSession(sent, campusDay(now));
  if (!checked.ok) return refused(checked.error);
  const change = { actor, id, version, content: checked.value, now };
  return db.transaction((tx) => apply(tx, change));
}
