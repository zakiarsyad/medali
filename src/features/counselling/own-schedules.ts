import { and, desc, eq, inArray } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { versionOf } from "@/db/row-version";
import { accounts, counsellingSchedules } from "@/db/schema";
import { ACTIVE_STATUSES } from "./schedule-ids";
import { topicOf } from "./schedule-rules";
import type { OwnScheduleView } from "./schedule-view";

/**
 * The active requests of the signed-in student, the newest first: always
 * their own, never those of a student that was sent. The story is not
 * read, and the Konselor is named once a time is agreed. Nothing for an
 * account without the right.
 */
export async function readOwnSchedules(
  db: Database,
  actor: AccountForAccess,
): Promise<OwnScheduleView[]> {
  if (!may(actor.roles, "register_own_counselling")) return [];
  if (actor.studentId === null) return [];
  const rows = await db
    .select({
      id: counsellingSchedules.id,
      kind: counsellingSchedules.kind,
      status: counsellingSchedules.status,
      topic: counsellingSchedules.topic,
      day: counsellingSchedules.day,
      hour: counsellingSchedules.hour,
      way: counsellingSchedules.way,
      counsellorName: accounts.name,
      counsellorMessage: counsellingSchedules.counsellorMessage,
      changedAt: counsellingSchedules.changedAt,
    })
    .from(counsellingSchedules)
    .leftJoin(accounts, eq(accounts.id, counsellingSchedules.counsellorId))
    .where(
      and(
        eq(counsellingSchedules.studentId, actor.studentId),
        inArray(counsellingSchedules.status, [...ACTIVE_STATUSES]),
      ),
    )
    .orderBy(desc(counsellingSchedules.createdAt));
  return rows.map(({ changedAt, ...row }) => {
    const isSubmitted = row.status === "submitted";
    return {
      ...row,
      topic: topicOf(row.kind, row.topic),
      counsellorName: row.status === "scheduled" ? row.counsellorName : null,
      counsellorMessage: isSubmitted ? null : row.counsellorMessage,
      version: versionOf(changedAt),
    };
  });
}
