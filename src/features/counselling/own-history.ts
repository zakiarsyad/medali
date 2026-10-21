import { and, desc, eq, inArray } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { counsellingSchedules } from "@/db/schema";
import { FINISHED_STATUSES } from "./schedule-ids";
import { topicOf } from "./schedule-rules";
import type { OwnHistoryPage, OwnHistoryView } from "./schedule-view";

const NOTHING: OwnHistoryPage = { items: [], hasMore: false };

/**
 * "Riwayat" of the signed-in student: up to `limit` of their own requests
 * that are Selesai, Tidak hadir or Dibatalkan, the latest day first.
 * Always their own, never those of a student that was sent. One more is
 * read to know whether there are more. Nothing for an account without
 * the right.
 */
export async function readOwnHistory(
  db: Database,
  actor: AccountForAccess,
  limit: number,
): Promise<OwnHistoryPage> {
  if (!may(actor.roles, "register_own_counselling")) return NOTHING;
  if (actor.studentId === null) return NOTHING;
  const rows = await db
    .select({
      id: counsellingSchedules.id,
      kind: counsellingSchedules.kind,
      status: counsellingSchedules.status,
      day: counsellingSchedules.day,
      topic: counsellingSchedules.topic,
    })
    .from(counsellingSchedules)
    .where(
      and(
        eq(counsellingSchedules.studentId, actor.studentId),
        inArray(counsellingSchedules.status, [...FINISHED_STATUSES]),
      ),
    )
    .orderBy(
      desc(counsellingSchedules.day),
      desc(counsellingSchedules.changedAt),
      desc(counsellingSchedules.id),
    )
    .limit(limit + 1);
  const items: OwnHistoryView[] = [];
  for (const row of rows.slice(0, limit)) {
    // A finished one always has its time; only a waiting assignment has none.
    if (row.day === null) throw new Error("A finished schedule has no day.");
    items.push({ ...row, day: row.day, topic: topicOf(row.kind, row.topic) });
  }
  return { items, hasMore: rows.length > limit };
}
