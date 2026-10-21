import { and, eq, gte, isNull, lte, type SQL, sql } from "drizzle-orm";
import type { CampusMoment } from "@/academic-periods/campus-clock";
import { daysAfter } from "@/academic-periods/days-after";
import { daysBefore } from "@/academic-periods/days-before";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activitySchedules,
  ppksActivities,
  students,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { OF_SCHEDULE } from "./list-schedules";
import { IS_NEWEST } from "./newest-attendances";
import { scheduleStatus } from "./schedule-status";
import { LONGEST_UPLOAD_DAYS } from "./student-schedules";
import { IS_CARD, OF_ATTENDANCE } from "./verification-cards";

/** The four numbers above the photo cards, over every period. */
export interface VerificationNumbers {
  /** The cards that wait to be checked, of students still meant. */
  waiting: number;
  /** The cards validated on today's date on campus. */
  validToday: number;
  /** The rejected cards still to be sent again, of students still meant. */
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

/**
 * The cards in each status. Those that wait and those rejected count only
 * while they still count for their student: the schedule is still meant
 * for them, and a rejected one is not followed by a newer attendance.
 */
async function countCards(db: Database, today: string, counted: SQL) {
  const { status, decidedAt } = activityAttendances;
  const from = startOf(today).toISOString();
  const until = startOf(daysAfter(today, 1)).toISOString();
  const [cards] = await db
    .select({
      waiting: sql<number>`count(*) filter (where ${status} = 'waiting' and (${counted}))::int`,
      rejected: sql<number>`count(*) filter (where ${status} = 'rejected' and (${counted}) and ${IS_NEWEST})::int`,
      validToday: sql<number>`count(*) filter (where ${status} = 'valid' and ${decidedAt} >= ${from}::timestamptz and ${decidedAt} < ${until}::timestamptz)::int`,
    })
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .innerJoin(students, eq(students.id, activityAttendances.studentId))
    .where(IS_CARD);
  return cards ?? { waiting: 0, rejected: 0, validToday: 0 };
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

/**
 * The numbers above the cards at a moment on campus. `counted` is who the
 * photos count for, as `countedAtEither` gives it.
 */
export async function readVerificationNumbers(
  db: Database,
  now: CampusMoment,
  counted: SQL,
): Promise<VerificationNumbers> {
  const [cards, begun] = await Promise.all([
    countCards(db, now.day, counted),
    readBegun(db, now.day),
  ]);
  const open = begun.filter((schedule) => {
    const startTime = hourAndMinute(schedule.startTime);
    return scheduleStatus({ ...schedule, startTime }, now) === "open";
  });
  const heldToday = begun.filter((schedule) => schedule.endsOn >= now.day);
  return { ...cards, heldToday: heldToday.length, openNow: open.length };
}
