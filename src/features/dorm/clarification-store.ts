import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormActivityVersions,
  dormAttendanceCounts,
  dormAttendanceMarks,
  dormClarificationChanges,
  dormClarifications,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { WRITTEN_NOW } from "@/db/written-now";
import {
  type DormClarificationStatus,
  WAITING_STATUSES,
} from "./clarification-ids";
import { WITHDRAWN_NOTE } from "./clarification-words";

/**
 * The version an activity had on the day of a count, also of an activity
 * removed since, so a count is named and timed as it was held.
 */
export const VERSION_OF_COUNT = and(
  eq(dormActivityVersions.activityId, dormAttendanceCounts.activityId),
  or(
    isNull(dormActivityVersions.shownFrom),
    lte(dormActivityVersions.shownFrom, dormAttendanceCounts.day),
  ),
  or(
    isNull(dormActivityVersions.shownUntil),
    gte(dormActivityVersions.shownUntil, dormAttendanceCounts.day),
  ),
);

/** A resident's own mark in an announced count, with the hours of its activity that day. */
export interface OwnAbsence {
  countId: string;
  isAbsent: boolean;
  startTime: string;
  endTime: string;
}

/**
 * The resident's own mark in the announced count of an activity on a
 * day, or null when there is no such count or it does not hold them.
 */
export async function readOwnMark(
  db: Database,
  studentId: string,
  activityId: string,
  day: string,
): Promise<OwnAbsence | null> {
  const [found] = await db
    .select({
      countId: dormAttendanceCounts.id,
      isAbsent: dormAttendanceMarks.isAbsent,
      startTime: dormActivityVersions.startTime,
      endTime: dormActivityVersions.endTime,
    })
    .from(dormAttendanceCounts)
    .innerJoin(
      dormAttendanceMarks,
      and(
        eq(dormAttendanceMarks.countId, dormAttendanceCounts.id),
        eq(dormAttendanceMarks.studentId, studentId),
      ),
    )
    .innerJoin(dormActivityVersions, VERSION_OF_COUNT)
    .where(
      and(
        eq(dormAttendanceCounts.activityId, activityId),
        eq(dormAttendanceCounts.day, day),
        isNotNull(dormAttendanceCounts.announcedAt),
      ),
    )
    .limit(1);
  if (!found) return null;
  return {
    ...found,
    startTime: hourAndMinute(found.startTime),
    endTime: hourAndMinute(found.endTime),
  };
}

/**
 * Closes the waiting clarifications of a count whose resident it no
 * longer holds absent, as BAM announced it again, with the note that the
 * absence was withdrawn and a line in the log for each. Called while the
 * count's activity is held; the clarifications are held too, so a
 * decision at the same moment waits, then finds them closed.
 */
export async function closeWithdrawn(
  tx: Database,
  countId: string,
  absentIds: ReadonlySet<string>,
  actorId: string,
): Promise<void> {
  const waiting = await tx
    .select({
      id: dormClarifications.id,
      studentId: dormClarifications.studentId,
      status: dormClarifications.status,
    })
    .from(dormClarifications)
    .where(
      and(
        eq(dormClarifications.countId, countId),
        inArray(dormClarifications.status, WAITING_STATUSES),
      ),
    )
    .for("update");
  const withdrawn = waiting.filter((each) => !absentIds.has(each.studentId));
  for (const each of withdrawn) {
    const [closed] = await tx
      .update(dormClarifications)
      .set({
        status: "closed",
        decidedBy: actorId,
        decidedAt: WRITTEN_NOW,
        decisionNote: WITHDRAWN_NOTE,
      })
      .where(eq(dormClarifications.id, each.id))
      .returning({ at: dormClarifications.decidedAt });
    await tx.insert(dormClarificationChanges).values({
      clarificationId: each.id,
      changedBy: actorId,
      changedAt: closed?.at ?? undefined,
      statusBefore: each.status,
      statusAfter: "closed",
      note: WITHDRAWN_NOTE,
    });
  }
}

/** The status of the newest clarification of a resident for a count, or null for none. */
export async function readNewestStatus(
  db: Database,
  studentId: string,
  countId: string,
): Promise<DormClarificationStatus | null> {
  const [newest] = await db
    .select({ status: dormClarifications.status })
    .from(dormClarifications)
    .where(
      and(
        eq(dormClarifications.studentId, studentId),
        eq(dormClarifications.countId, countId),
      ),
    )
    .orderBy(desc(dormClarifications.sentAt))
    .limit(1);
  return newest?.status ?? null;
}
