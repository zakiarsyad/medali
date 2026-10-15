import {
  and,
  desc,
  eq,
  gte,
  isNotNull,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import {
  dormAttendanceCounts,
  dormClarifications,
  dormViolations,
  dormWarningLetters,
  students,
} from "@/db/schema";
import { escalatedBy, inPeriodDays } from "./violation-conditions";
import { type PeriodDays, periodDays } from "./violation-periods";
import {
  SP1_REJECTIONS,
  SP1_VIOLATIONS,
  SP2_REJECTIONS,
  SP2_VIOLATIONS,
  type WarningLevel,
} from "./warning-ids";
import type { WarningStanding } from "./warning-rule";

/** A semester, by its key, its violation days and how it is named on screen. */
export interface WarningSemester {
  id: string;
  days: PeriodDays;
  title: string;
}

/**
 * The semester the calls and SPs of `now` belong to: the one "Academic
 * period" gives for today on campus. Null while no period is stored.
 */
export async function readWarningSemester(
  db: Database,
  now: Date,
): Promise<WarningSemester | null> {
  const periods = await readAcademicPeriods(db);
  const running = runningPeriodOn(periods, campusDay(now));
  if (running === null) return null;
  const days = periodDays(periods, running.id);
  if (days === null) return null;
  return { id: running.id, days, title: periodTitle(running) };
}

function ofSemesterDay(days: PeriodDays): SQL | undefined {
  const from = gte(dormAttendanceCounts.day, days.from);
  if (days.before === null) return from;
  return and(from, lt(dormAttendanceCounts.day, days.before));
}

/** How many violations of each student went up to Pengelola Asrama in the semester. */
function countedViolations(db: Database, semester: WarningSemester, now: Date) {
  return db
    .select({
      studentId: dormViolations.studentId,
      amount: sql<number>`count(*)::int`.as("counted_amount"),
    })
    .from(dormViolations)
    .where(and(escalatedBy(now), inPeriodDays(semester.days)))
    .groupBy(dormViolations.studentId)
    .as("counted");
}

/**
 * The latest clarification of each student for each activity held on a
 * day of the semester. Only the latest counts: one sent again, or
 * accepted later, takes a rejection's place.
 */
export function latestClarifications(db: Database, semester: WarningSemester) {
  return db
    .selectDistinctOn(
      [dormClarifications.countId, dormClarifications.studentId],
      {
        id: dormClarifications.id,
        studentId: dormClarifications.studentId,
        status: dormClarifications.status,
      },
    )
    .from(dormClarifications)
    .innerJoin(
      dormAttendanceCounts,
      eq(dormAttendanceCounts.id, dormClarifications.countId),
    )
    .where(ofSemesterDay(semester.days))
    .orderBy(
      dormClarifications.countId,
      dormClarifications.studentId,
      desc(dormClarifications.sentAt),
      desc(dormClarifications.id),
    )
    .as("latest_clarification");
}

/**
 * How many activities of the semester each student's latest
 * clarification was rejected for, by BAM or by Pengelola Asrama.
 */
function rejectedClarifications(db: Database, semester: WarningSemester) {
  const latest = latestClarifications(db, semester);
  return db
    .select({
      studentId: latest.studentId,
      amount: sql<number>`count(*)::int`.as("rejected_amount"),
    })
    .from(latest)
    .where(eq(latest.status, "rejected"))
    .groupBy(latest.studentId)
    .as("rejected");
}

/** Which SPs of the semester each student was issued. */
function issuedLetters(db: Database, semester: WarningSemester) {
  const { level } = dormWarningLetters;
  return db
    .select({
      studentId: dormWarningLetters.studentId,
      hasFirst: sql<boolean>`bool_or(${level} = 1)`.as("has_first"),
      hasSecond: sql<boolean>`bool_or(${level} = 2)`.as("has_second"),
    })
    .from(dormWarningLetters)
    .where(
      and(
        eq(dormWarningLetters.periodId, semester.id),
        isNotNull(dormWarningLetters.issuedAt),
      ),
    )
    .groupBy(dormWarningLetters.studentId)
    .as("issued");
}

/**
 * Where the students stand in a semester at `now`, by the server's
 * clock, to join to `students`: one row for each student with a counted
 * violation, a rejected clarification or an issued SP in it, with what
 * a `WarningStanding` holds and the SP they are called for, or null.
 */
export function standingsOf(
  db: Database,
  semester: WarningSemester,
  now: Date,
) {
  const counted = countedViolations(db, semester, now);
  const rejected = rejectedClarifications(db, semester);
  const issued = issuedLetters(db, semester);
  const amount = sql<number>`coalesce(${counted.amount}, 0)`;
  const rejections = sql<number>`coalesce(${rejected.amount}, 0)`;
  const hasFirst = sql<boolean>`coalesce(${issued.hasFirst}, false)`;
  const hasSecond = sql<boolean>`coalesce(${issued.hasSecond}, false)`;
  const callsFirst = and(
    sql`not ${hasFirst}`,
    or(gte(amount, SP1_VIOLATIONS), gte(rejections, SP1_REJECTIONS)),
  );
  const callsSecond = and(
    hasFirst,
    sql`not ${hasSecond}`,
    or(gte(amount, SP2_VIOLATIONS), gte(rejections, SP2_REJECTIONS)),
  );
  return db
    .select({
      studentId: students.id,
      counted: sql<number>`${amount}::int`.as("counted"),
      rejected: sql<number>`${rejections}::int`.as("rejected"),
      hasFirst: hasFirst.as("has_first"),
      hasSecond: hasSecond.as("has_second"),
      // The same answer `neededLevel` gives, which a check confirms.
      level:
        sql<WarningLevel | null>`(case when ${callsFirst} then 1 when ${callsSecond} then 2 end)::int`.as(
          "level",
        ),
    })
    .from(students)
    .leftJoin(counted, eq(counted.studentId, students.id))
    .leftJoin(rejected, eq(rejected.studentId, students.id))
    .leftJoin(issued, eq(issued.studentId, students.id))
    .where(
      or(
        isNotNull(counted.studentId),
        isNotNull(rejected.studentId),
        isNotNull(issued.studentId),
      ),
    )
    .as("standing");
}

/** The SP a student is called for now, and the semester it is of. */
export interface CallOf {
  semesterId: string;
  level: WarningLevel;
}

/**
 * The SP a student `visible` holds is called for in the running semester
 * at `now`, by the server's clock, or null for a student not called, not
 * seen, or while no period is stored.
 */
export async function readCallOf(
  db: Database,
  visible: SQL,
  studentId: string,
  now: Date,
): Promise<CallOf | null> {
  const semester = await readWarningSemester(db, now);
  if (semester === null) return null;
  const standing = standingsOf(db, semester, now);
  const [found] = await db
    .select({ level: standing.level })
    .from(standing)
    .innerJoin(students, eq(students.id, standing.studentId))
    .where(and(visible, eq(students.id, studentId)));
  if (!found || found.level === null) return null;
  return { semesterId: semester.id, level: found.level };
}

/** The standing a read gives back, without what else came with it. */
export function standingOf(row: WarningStanding): WarningStanding {
  return {
    counted: row.counted,
    rejected: row.rejected,
    hasFirst: row.hasFirst,
    hasSecond: row.hasSecond,
  };
}
