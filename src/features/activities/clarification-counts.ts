import { and, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  activityClarifications,
  activitySchedules,
  ppksActivities,
  students,
} from "@/db/schema";
import { OF_CLARIFICATION, OF_KEPT_SCHEDULE } from "./clarification-rows";
import { OF_SCHEDULE } from "./list-schedules";

/** How many clarifications stand in each status. */
export interface ClarificationCounts {
  submitted: number;
  accepted: number;
  rejected: number;
}

const NONE: ClarificationCounts = { submitted: 0, accepted: 0, rejected: 0 };

/**
 * The clarifications in each status, of schedules that are not removed,
 * over every period, in one read. `condition` limits the students they
 * are counted for and the activities they are of, or counts them all
 * when it is left out.
 */
export async function countClarifications(
  db: Database,
  condition?: SQL,
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
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .innerJoin(students, eq(students.id, activityClarifications.studentId))
    .where(and(OF_KEPT_SCHEDULE, condition));
  return counted ?? NONE;
}
