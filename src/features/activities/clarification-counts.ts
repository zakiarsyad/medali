import { and, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  activityClarifications,
  activitySchedules,
  students,
} from "@/db/schema";
import { OF_CLARIFICATION, OF_KEPT_SCHEDULE } from "./clarification-rows";

/** How many clarifications stand in each status. */
export interface ClarificationCounts {
  submitted: number;
  accepted: number;
  rejected: number;
}

const NONE: ClarificationCounts = { submitted: 0, accepted: 0, rejected: 0 };

/**
 * The clarifications in each status, of schedules that are not removed,
 * over every period, in one read. `visible` limits the students they are
 * counted for, or counts every student's when it is left out.
 */
export async function countClarifications(
  db: Database,
  visible?: SQL,
): Promise<ClarificationCounts> {
  const { status } = activityClarifications;
  const [counted] = await db
    .select({
      submitted: sql<number>`count(*) filter (where ${status} = 'submitted')::int`,
      accepted: sql<number>`count(*) filter (where ${status} = 'accepted')::int`,
      rejected: sql<number>`count(*) filter (where ${status} = 'rejected')::int`,
    })
    .from(activityClarifications)
    .innerJoin(activitySchedules, OF_CLARIFICATION)
    .innerJoin(students, eq(students.id, activityClarifications.studentId))
    .where(and(OF_KEPT_SCHEDULE, visible));
  return counted ?? NONE;
}
