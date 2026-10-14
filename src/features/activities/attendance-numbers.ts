import { and, count, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activitySchedules,
  ppksActivities,
  students,
} from "@/db/schema";
import { takingPartIn } from "./chosen-students";
import { listedSchedules, OF_SCHEDULE, ofKind } from "./list-schedules";
import type { MeanScore } from "./mean-score";
import { readMeanScore } from "./read-mean-score";
import type { ScheduleKind, ScheduleScope } from "./schedule-list-address";
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

/** The schedules of a scope, by whether they have started. */
async function countSchedules(
  db: Database,
  scope: ScheduleScope,
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
    .where(listedSchedules(scope));
  return counted ?? { held: 0, coming: 0 };
}

/**
 * The students whose photos count at the schedules of a kind. At an extra
 * activity only those who take part in it now count, as for Hadir: the
 * photo of one taken out stays to be decided, but counts nowhere.
 */
function countedAt(kind: ScheduleKind): SQL | undefined {
  if (kind === "ppks") return undefined;
  return takingPartIn(activitySchedules.id);
}

/** The photos that wait, at the schedules of the activities of a kind. */
async function countWaiting(
  db: Database,
  visible: SQL,
  kind: ScheduleKind,
): Promise<number> {
  const [counted] = await db
    .select({ waiting: count() })
    .from(activityAttendances)
    .innerJoin(activitySchedules, OF_ATTENDANCE)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .innerJoin(students, eq(students.id, activityAttendances.studentId))
    .where(
      and(
        IS_CARD,
        ofKind(kind),
        eq(activityAttendances.status, "waiting"),
        visible,
        countedAt(kind),
      ),
    );
  return counted?.waiting ?? 0;
}

/**
 * The numbers above "Jadwal dan kehadiran" of a tab on a day on campus.
 * The two that count schedules follow the scope, with its tahap, and the
 * photos that wait are those of the tab's kind of activity. The mean
 * holds every kind. The two that count students are limited by `visible`
 * to those the account sees, so Ketua Program Studi and Pengasuh get the
 * numbers of their own students only.
 */
export async function readAttendanceNumbers(
  db: Database,
  visible: SQL,
  scope: ScheduleScope,
  today: string,
): Promise<AttendanceNumbers> {
  const [mean, schedules, waiting] = await Promise.all([
    readMeanScore(db, visible, today),
    countSchedules(db, scope, today),
    countWaiting(db, visible, scope.kind),
  ]);
  return { mean, ...schedules, waiting };
}
