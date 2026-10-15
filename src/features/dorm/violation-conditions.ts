import { and, gt, gte, isNull, lt, lte, or, type SQL, sql } from "drizzle-orm";
import { dormViolationAppeals, dormViolations } from "@/db/schema";
import type { AppealStatus } from "./appeal-ids";
import type { PeriodDays } from "./violation-periods";
import { lastEscalatedAnnouncement } from "./violation-status";

/*
 * Where a violation stands, for the `where` of a read: the same answer as
 * `violationStatus` gives at the same moment, which a check confirms.
 */

const NOT_CANCELLED = isNull(dormViolations.cancelledAt);

/** Not reduced by Pengelola Asrama, or its reduction undone. */
export const NOT_REDUCED = isNull(dormViolations.reducedAt);

/** The violation has no appeal. A violation has one at most. */
const NO_APPEAL = sql`not exists (select 1 from ${dormViolationAppeals} where ${dormViolationAppeals.violationId} = ${dormViolations.id})`;

/** The violation has an appeal in this status. */
function appealIs(status: AppealStatus): SQL {
  return sql`exists (select 1 from ${dormViolationAppeals} where ${dormViolationAppeals.violationId} = ${dormViolations.id} and ${dormViolationAppeals.status} = ${status})`;
}

/**
 * Not cancelled and announced at `now`: Masa advokasi, Advokasi
 * diproses, Advokasi diterima or Naik ke Pengelola.
 */
export function announcedBy(now: Date): SQL | undefined {
  return and(NOT_CANCELLED, lte(dormViolations.announcedAt, now));
}

/** Not cancelled and in Masa advokasi at `now`: announced, within 3 hours, no appeal. */
export function inAppealAt(now: Date): SQL | undefined {
  return and(
    announcedBy(now),
    gt(dormViolations.announcedAt, lastEscalatedAnnouncement(now)),
    NO_APPEAL,
  );
}

/** "Dalam masa advokasi" at `now`: Masa advokasi or Advokasi diproses. */
export function inAppealOrWaitingAt(now: Date): SQL | undefined {
  return or(inAppealAt(now), and(NOT_CANCELLED, appealIs("waiting")));
}

/** Advokasi diterima: it never counts. */
export const APPEAL_ACCEPTED = and(NOT_CANCELLED, appealIs("accepted"));

/**
 * Not cancelled, not reduced, and gone up to Pengelola Asrama at `now`:
 * its appeal time over without an appeal, or its appeal rejected. Only
 * these count.
 */
export function escalatedBy(now: Date): SQL | undefined {
  const timeOver = and(
    lte(dormViolations.announcedAt, lastEscalatedAnnouncement(now)),
    NO_APPEAL,
  );
  return and(NOT_CANCELLED, NOT_REDUCED, or(timeOver, appealIs("rejected")));
}

/** Announced at `now`, from the moment the campus day of `now` began. */
export function announcedToday(now: Date, dayStart: Date): SQL | undefined {
  return and(announcedBy(now), gte(dormViolations.announcedAt, dayStart));
}

/** A violation day of a period. */
export function inPeriodDays(days: PeriodDays): SQL | undefined {
  const from = gte(dormViolations.day, days.from);
  if (days.before === null) return from;
  return and(from, lt(dormViolations.day, days.before));
}

/** The moment a campus day begins, at 00:00 in campus time. */
export function campusDayStart(day: string): Date {
  return new Date(`${day}T00:00:00+07:00`);
}
