import { and, asc, count, eq, gt, isNull, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, dormViolations, students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import { type Punishment, VIOLATIONS_PAGE_SIZE } from "./violation-ids";

/** A violation that waits for its announcement, as Jadwal publikasi shows it. */
export interface ScheduledViolation {
  id: string;
  studentId: string;
  announcedAt: Date;
  day: string;
  name: string;
  nim: string;
  dorm: DormId;
  reason: string;
  punishment: Punishment;
  otherPunishment: string;
  /** The name of the account that recorded it. */
  enteredBy: string;
}

export interface ViolationSchedule {
  rows: ScheduledViolation[];
  /** How many violations wait in all. */
  matching: number;
  page: number;
}

/** Not cancelled, and not announced yet at a moment. */
function waitingAt(now: Date): SQL | undefined {
  return and(
    isNull(dormViolations.cancelledAt),
    gt(dormViolations.announcedAt, now),
  );
}

/**
 * "Jadwal publikasi": the violations of the students `visible` holds that
 * are not cancelled and wait for their announcement at `now`, by the
 * server's clock, the soonest announcement first, 20 a page.
 */
export async function readViolationSchedule(
  db: Database,
  visible: SQL,
  now: Date,
  page: number,
): Promise<ViolationSchedule> {
  const where = and(waitingAt(now), visible);
  const [counted] = await db
    .select({ matching: count() })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .where(where);
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, VIOLATIONS_PAGE_SIZE);
  const rows = await db
    .select({
      id: dormViolations.id,
      studentId: dormViolations.studentId,
      announcedAt: dormViolations.announcedAt,
      day: dormViolations.day,
      name: students.name,
      nim: students.nim,
      dorm: dormViolations.dorm,
      reason: dormViolations.reason,
      punishment: dormViolations.punishment,
      otherPunishment: dormViolations.otherPunishment,
      enteredBy: accounts.name,
    })
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .innerJoin(accounts, eq(accounts.id, dormViolations.enteredBy))
    .where(where)
    .orderBy(
      asc(dormViolations.announcedAt),
      asc(students.name),
      asc(dormViolations.id),
    )
    .limit(VIOLATIONS_PAGE_SIZE)
    .offset((shown - 1) * VIOLATIONS_PAGE_SIZE);
  return { rows, matching, page: shown };
}
