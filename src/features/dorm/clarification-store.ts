import { and, desc, eq, gte, isNotNull, isNull, lte, or } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormActivityVersions,
  dormAttendanceCounts,
  dormAttendanceMarks,
  dormClarifications,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import type { DormClarificationStatus } from "./clarification-ids";

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
