import {
  and,
  asc,
  count,
  desc,
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
import { daysBefore } from "@/academic-periods/days-before";
import type { Database } from "@/db/connect";
import {
  activityAttendances,
  activitySchedules,
  ppksActivities,
} from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import { pageWithin } from "@/ui/list-pages";
import type { CandidateStudent } from "./chosen-participants";
import { naming } from "./chosen-students";
import type { PeriodSemester } from "./participants";
import type { OwnAttendance, StudentSchedule } from "./student-schedule";
import { UPLOAD_COUNT_MAX } from "./upload-range";

/** How many schedules one page of the history shows. */
export const HISTORY_PAGE_SIZE = 20;

/** How many schedules "Akan datang" shows. */
export const COMING_COUNT = 5;

/** The longest an upload stays open after the last day: 52 weeks. */
export const LONGEST_UPLOAD_DAYS = UPLOAD_COUNT_MAX * 7;

const ROW = {
  id: activitySchedules.id,
  startsOn: activitySchedules.startsOn,
  endsOn: activitySchedules.endsOn,
  startTime: activitySchedules.startTime,
  endTime: activitySchedules.endTime,
  uploadCount: activitySchedules.uploadCount,
  uploadUnit: activitySchedules.uploadUnit,
  location: activitySchedules.location,
  isRequired: activitySchedules.isRequired,
  name: ppksActivities.name,
  description: ppksActivities.description,
  valueKeys: ppksActivities.valueKeys,
};

const OF_SCHEDULE = eq(ppksActivities.id, activitySchedules.activityId);

/**
 * The schedules that are meant for a student, among those not removed
 * of the periods given: of a PPKS activity of the semester the student
 * is in during the period the schedule keeps, or of a special or
 * additional activity that names the student, their class or their
 * angkatan. `semesters` holds the periods in which the student takes
 * part, with their semester in each: with none, as for a student who is
 * not Aktif, no schedule is meant for them.
 */
export function meantFor(
  semesters: readonly PeriodSemester[],
  student: Omit<CandidateStudent, "isActive">,
): SQL {
  const ofSemester = or(
    ...semesters.map(({ periodId, semester }) =>
      and(
        eq(activitySchedules.academicPeriodId, periodId),
        eq(ppksActivities.semester, semester),
      ),
    ),
  );
  if (ofSemester === undefined) return sql`false`;
  const periodIds = semesters.map(({ periodId }) => periodId);
  const chosen = and(
    inArray(activitySchedules.academicPeriodId, periodIds),
    isNull(ppksActivities.semester),
    naming(student),
  );
  return (
    and(isNull(activitySchedules.deletedAt), or(ofSemester, chosen)) ??
    sql`false`
  );
}

function found(db: Database, condition: SQL | undefined) {
  return db
    .select(ROW)
    .from(activitySchedules)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .where(condition);
}

type StoredRow = Awaited<ReturnType<typeof found>>[number];

function scheduleOf(stored: StoredRow): StudentSchedule {
  return {
    ...stored,
    startTime: hourAndMinute(stored.startTime),
    endTime: hourAndMinute(stored.endTime),
    attendance: null,
  };
}

/**
 * The schedules that began by a day and whose upload time may still be
 * open on it: the last day is no longer ago than the longest upload
 * range. The status rule then tells which of them really are open.
 */
export async function readBegunSchedules(
  db: Database,
  meant: SQL,
  today: string,
): Promise<StudentSchedule[]> {
  const earliestEnd = daysBefore(today, LONGEST_UPLOAD_DAYS);
  const rows = await found(
    db,
    and(
      meant,
      lte(activitySchedules.startsOn, today),
      gte(activitySchedules.endsOn, earliestEnd),
    ),
  ).orderBy(asc(activitySchedules.startsOn), asc(activitySchedules.id));
  return rows.map(scheduleOf);
}

/** The next schedules after a day, the earliest first. */
export async function readComingSchedules(
  db: Database,
  meant: SQL,
  today: string,
): Promise<StudentSchedule[]> {
  const rows = await found(
    db,
    and(meant, gt(activitySchedules.startsOn, today)),
  )
    .orderBy(
      asc(activitySchedules.startsOn),
      asc(activitySchedules.startTime),
      asc(activitySchedules.id),
    )
    .limit(COMING_COUNT);
  return rows.map(scheduleOf);
}

/** One page of the history, and how many schedules the history has in all. */
export interface ScheduleHistory {
  schedules: StudentSchedule[];
  matching: number;
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

/** One page of the schedules whose last day is over, the newest first. */
export async function readPastSchedules(
  db: Database,
  meant: SQL,
  today: string,
  page: number,
): Promise<ScheduleHistory> {
  const past = and(meant, lt(activitySchedules.endsOn, today));
  const [counted] = await db
    .select({ matching: count() })
    .from(activitySchedules)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .where(past);
  const matching = counted?.matching ?? 0;
  const shownPage = pageWithin(page, matching, HISTORY_PAGE_SIZE);
  const rows = await found(db, past)
    .orderBy(desc(activitySchedules.startsOn), desc(activitySchedules.id))
    .limit(HISTORY_PAGE_SIZE)
    .offset((shownPage - 1) * HISTORY_PAGE_SIZE);
  return { schedules: rows.map(scheduleOf), matching, page: shownPage };
}

/** Every schedule that is meant, as the score needs them all. */
export async function readAllSchedules(
  db: Database,
  meant: SQL,
): Promise<StudentSchedule[]> {
  const rows = await found(db, meant);
  return rows.map(scheduleOf);
}

/**
 * The order that puts the newest attendance first: by when its photo was
 * sent, or for a record made by hand, which has no photo, when it was made.
 */
export const NEWEST_FIRST = desc(
  sql`coalesce(${activityAttendances.sentAt}, ${activityAttendances.decidedAt})`,
);

/**
 * The newest attendance of one student at each of some schedules. The
 * student is the one the account's own rows hold, never one asked for
 * from outside.
 */
export async function readOwnAttendances(
  db: Database,
  studentId: string,
  scheduleIds: readonly string[],
): Promise<Map<string, OwnAttendance>> {
  const newest = new Map<string, OwnAttendance>();
  if (scheduleIds.length === 0) return newest;
  const rows = await db
    .select({
      scheduleId: activityAttendances.scheduleId,
      status: activityAttendances.status,
      note: activityAttendances.note,
      sentAt: activityAttendances.sentAt,
    })
    .from(activityAttendances)
    .where(
      and(
        eq(activityAttendances.studentId, studentId),
        inArray(activityAttendances.scheduleId, [...new Set(scheduleIds)]),
      ),
    )
    .orderBy(NEWEST_FIRST);
  for (const { scheduleId, ...attendance } of rows) {
    if (!newest.has(scheduleId)) newest.set(scheduleId, attendance);
  }
  return newest;
}
