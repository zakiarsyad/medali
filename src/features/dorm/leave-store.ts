import { and, eq, gt, gte, inArray, isNull, lt, lte, or } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormActivityVersions, dormLeaves, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { audiencesCovering } from "./activity-audience";
import { readVersions } from "./activity-reads";
import type { ActivityRow } from "./activity-row";
import type { LeaveSpan } from "./leave-cover";

/*
 * What asking for, cancelling, deciding and showing leave share.
 */

/** The statuses whose leave holds its time: no other may overlap it. */
export const HOLDING = inArray(dormLeaves.status, ["submitted", "approved"]);

/**
 * Holds a student until the transaction ends, so a second request of
 * theirs waits, and then sees what the first one saved. Held without its
 * key, so a row that only names the student need not wait.
 */
export async function lockStudent(
  tx: Database,
  studentId: string,
): Promise<void> {
  await tx
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, studentId))
    .for("no key update");
}

/** Whether a student has a leave that waits or is approved in the span. */
export async function overlapsOwn(
  db: Database,
  studentId: string,
  span: LeaveSpan,
): Promise<boolean> {
  const [found] = await db
    .select({ id: dormLeaves.id })
    .from(dormLeaves)
    .where(
      and(
        eq(dormLeaves.studentId, studentId),
        HOLDING,
        lt(dormLeaves.startsAt, span.end),
        gt(dormLeaves.endsAt, span.start),
      ),
    )
    .limit(1);
  return found !== undefined;
}

/**
 * The versions of the activities of a dorm's residents that may take
 * place on a day from `firstDay` to `lastDay`.
 */
export function readActivityRows(
  db: Database,
  dorms: DormId[],
  firstDay: string,
  lastDay: string,
): Promise<ActivityRow[]> {
  const audiences = [...new Set(dorms.flatMap(audiencesCovering))];
  if (audiences.length === 0) return Promise.resolve([]);
  return readVersions(
    db,
    and(
      inArray(dormActivityVersions.audience, audiences),
      lte(dormActivityVersions.startsOn, lastDay),
      or(
        isNull(dormActivityVersions.endsOn),
        gte(dormActivityVersions.endsOn, firstDay),
      ),
      or(
        isNull(dormActivityVersions.shownFrom),
        lte(dormActivityVersions.shownFrom, lastDay),
      ),
      or(
        isNull(dormActivityVersions.shownUntil),
        gte(dormActivityVersions.shownUntil, firstDay),
      ),
    ),
  );
}
