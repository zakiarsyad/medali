import { and, gt, gte, isNull, lt, lte, type SQL } from "drizzle-orm";
import { dormViolations } from "@/db/schema";
import type { PeriodDays } from "./violation-periods";
import { lastEscalatedAnnouncement } from "./violation-status";

/*
 * Where a violation stands, for the `where` of a read: the same answer as
 * `violationStatus` gives at the same moment, which a check confirms.
 */

const NOT_CANCELLED = isNull(dormViolations.cancelledAt);

/** Not cancelled and announced at `now`: Masa advokasi or Naik ke Pengelola. */
export function announcedBy(now: Date): SQL | undefined {
  return and(NOT_CANCELLED, lte(dormViolations.announcedAt, now));
}

/** Not cancelled and in Masa advokasi at `now`. */
export function inAppealAt(now: Date): SQL | undefined {
  return and(
    announcedBy(now),
    gt(dormViolations.announcedAt, lastEscalatedAnnouncement(now)),
  );
}

/** Not cancelled and gone up to Pengelola Asrama at `now`. */
export function escalatedBy(now: Date): SQL | undefined {
  return and(
    NOT_CANCELLED,
    lte(dormViolations.announcedAt, lastEscalatedAnnouncement(now)),
  );
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
