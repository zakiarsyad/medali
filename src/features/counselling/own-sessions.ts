import { count, desc, eq } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingSessions } from "@/db/schema";
import type { OwnSessionSummary } from "./session-view";

/**
 * What the signed-in student sees of their own counselling sessions:
 * how many, the day of the latest, and its next session. Never the
 * notes, and always their own, never those of a student that was sent.
 * Nothing for a student with no session, and for an account without
 * the right.
 */
export async function readOwnSessionSummary(
  db: Database,
  actor: AccountForAccess,
): Promise<OwnSessionSummary | null> {
  if (!may(actor.roles, "view_own_counselling_sessions")) return null;
  if (actor.studentId === null) return null;
  const own = eq(counsellingSessions.studentId, actor.studentId);
  const [counted] = await db
    .select({ count: count() })
    .from(counsellingSessions)
    .where(own);
  const [latest] = await db
    .select({
      day: counsellingSessions.day,
      nextDay: counsellingSessions.nextDay,
    })
    .from(counsellingSessions)
    .where(own)
    .orderBy(
      desc(counsellingSessions.day),
      desc(counsellingSessions.writtenAt),
      desc(counsellingSessions.id),
    )
    .limit(1);
  if (!counted || !latest) return null;
  return { count: counted.count, lastDay: latest.day, nextDay: latest.nextDay };
}
