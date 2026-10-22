import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { readSessionSummary } from "@/mental-health/session-summary";
import type { OwnSessionSummary } from "@/mental-health/session-view";

/**
 * What the signed-in student sees of their own counselling sessions:
 * how many, the day of the latest, and its next session while that is
 * today or later on campus. Never the notes, and always their own, never
 * those of a student that was sent. Nothing for a student with no
 * session, and for an account without the right.
 */
export async function readOwnSessionSummary(
  db: Database,
  actor: AccountForAccess,
  now: Date = new Date(),
): Promise<OwnSessionSummary | null> {
  if (!may(actor.roles, "view_own_counselling_sessions")) return null;
  if (actor.studentId === null) return null;
  const summary = await readSessionSummary(db, actor.studentId, now);
  if (summary === null) return null;
  return {
    count: summary.count,
    lastDay: summary.lastDay,
    nextDay: summary.nextDay,
  };
}
