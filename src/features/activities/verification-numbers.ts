import { and, gte, isNull, lte, sql } from "drizzle-orm";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import { daysAfter } from "@/academic-periods/days-after";
import { daysBefore } from "@/academic-periods/days-before";
import type { Database } from "@/db/connect";
import { activityAttendances, activitySchedules } from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { scheduleStatus } from "./schedule-status";
import { LONGEST_UPLOAD_DAYS } from "./student-schedules";
import { IS_CARD, OF_ATTENDANCE } from "./verification-cards";

/** The four numbers above the photo cards, over every period. */
export interface VerificationNumbers {
  /** The cards that wait to be checked. */
  waiting: number;
  /** The cards validated on today's date on campus. */
  validToday: number;
  /** The rejected cards. */
  rejected: number;
  /** The schedules held today. */
  heldToday: number;
  /** The schedules whose upload time is open now. */
  openNow: number;
}

/** The moment a day starts on campus. */
function startOf(day: string): Date {
  return new Date(`${day}T00:00:00+07:00`);
}

async function countCards(db: Database, today: string) {
  const { status, decidedAt } = activityAttendances;
  const from = startOf(today).toISOString();
  const until = startOf(daysAfter(today, 1)).toISOString();
  const [counted] = await db
    .select({
      waiting: sql<number>`count(*) filter (where ${status} = 'waiting')::int`,
      rejected: sql<number>`count(*) filter (where ${status} = 'rejected')::int`,
      validToday: sql<number>`count(*) filter (where ${status} = 'valid' and ${decidedAt} >= ${from}::timestamptz and ${decidedAt} < ${until}::timestamptz)::int`,
    })
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .where(IS_CARD);
  return counted ?? { waiting: 0, rejected: 0, validToday: 0 };
}

/**
 * The schedules that began by today and whose upload time may still be
 * open: the status rule then tells which of them really are.
 */
function readBegun(db: Database, today: string) {
  return db
    .select({
      startsOn: activitySchedules.startsOn,
      endsOn: activitySchedules.endsOn,
      startTime: activitySchedules.startTime,
      uploadCount: activitySchedules.uploadCount,
      uploadUnit: activitySchedules.uploadUnit,
    })
    .from(activitySchedules)
    .where(
      and(
        isNull(activitySchedules.deletedAt),
        lte(activitySchedules.startsOn, today),
        gte(activitySchedules.endsOn, daysBefore(today, LONGEST_UPLOAD_DAYS)),
      ),
    );
}

/** The numbers above the cards at a moment on campus. */
export async function readVerificationNumbers(
  db: Database,
  now: CampusMoment,
): Promise<VerificationNumbers> {
  const [cards, begun] = await Promise.all([
    countCards(db, now.day),
    readBegun(db, now.day),
  ]);
  const open = begun.filter((schedule) => {
    const startTime = hourAndMinute(schedule.startTime);
    return scheduleStatus({ ...schedule, startTime }, now) === "open";
  });
  const heldToday = begun.filter((schedule) => schedule.endsOn >= now.day);
  return { ...cards, heldToday: heldToday.length, openNow: open.length };
}
