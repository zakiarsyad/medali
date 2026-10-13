import { and, count, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activitySchedules,
  ppksActivities,
  students,
} from "@/db/schema";
import { listedSchedules, OF_SCHEDULE } from "./list-schedules";
import type { MeanScore } from "./mean-score";
import { readMeanScore } from "./read-mean-score";
import { IS_CARD, OF_ATTENDANCE } from "./verification-cards";

/** The four numbers above the list of schedules. */
export interface AttendanceNumbers {
  /** Rerata nilai kehadiran of the students the account sees. */
  mean: MeanScore;
  /** The required schedules that have started. */
  held: number;
  /** The photos of the students the account sees that wait to be checked. */
  waiting: number;
  /** The schedules that start after today. */
  coming: number;
}

/** The schedules of a tahap, or of every tahap, by whether they have started. */
async function countSchedules(
  db: Database,
  level: number | null,
  today: string,
) {
  const { isRequired, startsOn } = activitySchedules;
  const [counted] = await db
    .select({
      held: sql<number>`count(*) filter (where ${isRequired} and ${startsOn} <= ${today})::int`,
      coming: sql<number>`count(*) filter (where ${startsOn} > ${today})::int`,
    })
    .from(activitySchedules)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .where(listedSchedules(level));
  return counted ?? { held: 0, coming: 0 };
}

async function countWaiting(db: Database, visible: SQL): Promise<number> {
  const [counted] = await db
    .select({ waiting: count() })
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .innerJoin(students, eq(students.id, activityAttendances.studentId))
    .where(and(IS_CARD, eq(activityAttendances.status, "waiting"), visible));
  return counted?.waiting ?? 0;
}

/**
 * The numbers above "Jadwal dan kehadiran" on a day on campus. The two
 * that count schedules follow the tahap chosen. The two that count
 * students are limited by `visible` to those the account sees, so Ketua
 * Program Studi and Pengasuh get the numbers of their own students only.
 */
export async function readAttendanceNumbers(
  db: Database,
  visible: SQL,
  level: number | null,
  today: string,
): Promise<AttendanceNumbers> {
  const [mean, schedules, waiting] = await Promise.all([
    readMeanScore(db, visible, today),
    countSchedules(db, level, today),
    countWaiting(db, visible),
  ]);
  return { mean, ...schedules, waiting };
}
