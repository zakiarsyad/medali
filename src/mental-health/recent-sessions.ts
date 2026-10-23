import { and, count, eq, type SQL, sql } from "drizzle-orm";
import { daysBefore } from "@/academic-periods/days-before";
import type { Database } from "@/db/connect";
import { counsellingSessions, students } from "@/db/schema";

/** The days "Sesi 30 hari" looks back over, today not counted. */
const SESSION_DAYS = 30;

/** The sessions held from 30 days before today up to today, on campus. */
export function heldInLast30Days(today: string): SQL {
  const from = daysBefore(today, SESSION_DAYS);
  return sql`${counsellingSessions.day} between ${from} and ${today}`;
}

/**
 * How many sessions the students `where` lets through had from 30 days
 * before today up to today. Only the number leaves the database.
 */
export async function countRecentSessions(
  db: Database,
  where: SQL,
  today: string,
): Promise<number> {
  const [found] = await db
    .select({ sessions: count() })
    .from(counsellingSessions)
    .innerJoin(students, eq(students.id, counsellingSessions.studentId))
    .where(and(heldInLast30Days(today), where));
  return found?.sessions ?? 0;
}
