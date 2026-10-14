import {
  and,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormActivityVersions, dormLeaves, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { audiencesCovering } from "./activity-audience";
import { readVersions } from "./activity-reads";
import type { ActivityRow } from "./activity-row";
import type { LeaveSpan } from "./leave-cover";
import { APPROVED_STATUSES } from "./leave-ids";
import type { ApprovedLeave } from "./leave-marks";

/*
 * What asking for, cancelling, deciding and showing leave share.
 */

/** The statuses whose leave holds its time: no other may overlap it. */
export const HOLDING = inArray(dormLeaves.status, [
  "submitted",
  ...APPROVED_STATUSES,
]);

/**
 * When a leave stops covering the resident: at their return once there
 * is one, earlier or later than its end, and at its end until then.
 */
export const LEAVE_END =
  sql<Date>`coalesce(${dormLeaves.returnedAt}, ${dormLeaves.endsAt})`.mapWith(
    dormLeaves.endsAt,
  );

/** Whether a leave still covers the resident after a moment. */
export function coversAfter(moment: Date): SQL {
  return gt(LEAVE_END, sql.param(moment, dormLeaves.endsAt));
}

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

/**
 * Whether a student has a leave that waits or is approved in the span,
 * up to its return for one that is Selesai.
 */
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
        coversAfter(span.start),
      ),
    )
    .limit(1);
  return found !== undefined;
}

/**
 * The approved leave, Selesai or not, whose time up to its return
 * overlaps a span, of the students `which` picks from the student rows:
 * of every student when it is not given.
 */
export async function readApprovedLeaves(
  db: Database,
  span: LeaveSpan,
  which?: SQL,
): Promise<ApprovedLeave[]> {
  const rows = await db
    .select({
      studentId: dormLeaves.studentId,
      kind: dormLeaves.kind,
      start: dormLeaves.startsAt,
      end: LEAVE_END,
    })
    .from(dormLeaves)
    .innerJoin(students, eq(students.id, dormLeaves.studentId))
    .where(
      and(
        inArray(dormLeaves.status, APPROVED_STATUSES),
        lt(dormLeaves.startsAt, span.end),
        coversAfter(span.start),
        which,
      ),
    );
  return rows;
}

/** An activity's time on its day, as a span of moments. */
export function spanOfHeld(held: {
  day: string;
  startTime: string;
  endTime: string;
}): LeaveSpan {
  return {
    start: new Date(`${held.day}T${held.startTime}:00+07:00`),
    end: new Date(`${held.day}T${held.endTime}:00+07:00`),
  };
}

/** A whole day on campus, as a span of moments. */
export function spanOfDay(day: string): LeaveSpan {
  const start = new Date(`${day}T00:00:00+07:00`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
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
