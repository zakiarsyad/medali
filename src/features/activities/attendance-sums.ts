import { and, eq, type SQL, sql } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import { activityScheduleParticipants as chosen, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { ATTENDANCE_MARKS } from "@/mentoring/meeting-ids";
import {
  markOutcomes,
  type ScheduleOutcome,
  scheduleOutcomes,
} from "./attendance-outcomes";
import type { CountedSchedule } from "./mean-score";
import { markTallies } from "./meeting-marks";
import { newestAt } from "./newest-attendances";
import { NAMES_STUDENT, readCounted } from "./read-mean-score";

/** What Nilai kehadiran kegiatan of many students is added up from. */
export interface AttendanceBasis {
  period: AcademicPeriod;
  schedules: CountedSchedule[];
  outcomes: ScheduleOutcome[];
}

/** The angkatan that have Aktif students. */
async function readCohortYears(db: Database): Promise<number[]> {
  const rows = await db
    .selectDistinct({ cohortYear: students.cohortYear })
    .from(students)
    .where(ACTIVE_MEMBER);
  return rows.map((row) => row.cohortYear);
}

/**
 * What every schedule of the period that runs on `today` adds for whom,
 * by the rule of the student's own page, or null with no running period:
 * then nobody has a score.
 */
export async function readAttendanceBasis(
  db: Database,
  today: string,
): Promise<AttendanceBasis | null> {
  const period = runningPeriodOn(await readAcademicPeriods(db), today);
  if (period === null) return null;
  const [schedules, cohortYears] = await Promise.all([
    readCounted(db, period.id),
    readCohortYears(db),
  ]);
  const outcomes = scheduleOutcomes(schedules, cohortYears, period, today);
  return { period, schedules, outcomes };
}

const OUTCOME = "outcome";

function outcomeColumn(name: string): SQL {
  return sql`${sql.identifier(OUTCOME)}.${sql.identifier(name)}`;
}

/** The outcomes as a table the database can join. */
function outcomeTable(outcomes: readonly ScheduleOutcome[]): SQL {
  const rows = outcomes.map((outcome) => ({
    schedule_id: outcome.scheduleId,
    cohort_year: outcome.cohortYear,
    status: outcome.status,
    named_only: outcome.namedOnly,
    attended: outcome.attended,
    counted: outcome.counted,
  }));
  return sql`jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) as ${sql.identifier(OUTCOME)}(schedule_id uuid, cohort_year integer, status text, named_only boolean, attended integer, counted integer)`;
}

/** Whether a schedule's participants name the student. */
const IS_NAMED = sql`exists (select 1 from ${chosen} where ${chosen.scheduleId} = ${outcomeColumn("schedule_id")} and ${NAMES_STUDENT})`;

/**
 * What the schedules of the period add for each Aktif student `visible`
 * lets through: the outcome of each schedule for the student's angkatan
 * and for how their newest attendance there stands. A student nothing
 * adds anything for has no row.
 */
function activitySums(db: Database, visible: SQL, basis: AttendanceBasis) {
  const scheduleIds = basis.schedules.map((schedule) => schedule.id);
  const newest = newestAt(db, scheduleIds);
  const standsSo = sql`${outcomeColumn("status")} is not distinct from ${newest.status}::text`;
  const meantFor = sql`(not ${outcomeColumn("named_only")} or ${IS_NAMED})`;
  return db
    .select({
      studentId: students.id,
      attended: sql<number>`sum(${outcomeColumn("attended")})::integer`.as(
        "activities_attended",
      ),
      counted: sql<number>`sum(${outcomeColumn("counted")})::integer`.as(
        "activities_counted",
      ),
    })
    .from(students)
    .innerJoin(
      outcomeTable(basis.outcomes),
      eq(outcomeColumn("cohort_year"), students.cohortYear),
    )
    .leftJoin(
      newest,
      and(
        eq(newest.studentId, students.id),
        eq(newest.scheduleId, outcomeColumn("schedule_id")),
      ),
    )
    .where(and(ACTIVE_MEMBER, visible, standsSo, meantFor))
    .groupBy(students.id)
    .as("activity_sums");
}

type Tallies = ReturnType<typeof markTallies>;

/** What a student's marks at the meetings add, by the outcome of each mark. */
function markSum(tallies: Tallies, side: "attended" | "counted"): SQL {
  const outcomes = markOutcomes();
  const terms = ATTENDANCE_MARKS.map(
    (mark) =>
      sql`coalesce(${tallies[mark]}, 0) * ${outcomes[mark][side]}::integer`,
  );
  return sql.join(terms, sql` + `);
}

/**
 * Nilai kehadiran kegiatan of each Aktif student `visible` lets through,
 * as attended and counted, as a table to join: the schedules of the
 * period meant for them and their marks at its meetings, added up in the
 * database from what the one rule says each of them adds.
 */
export function attendanceSums(
  db: Database,
  visible: SQL,
  basis: AttendanceBasis,
) {
  const activities = activitySums(db, visible, basis);
  const tallies = markTallies(db, basis.period.id);
  const attended = sql`coalesce(${activities.attended}, 0) + ${markSum(tallies, "attended")}`;
  const counted = sql`coalesce(${activities.counted}, 0) + ${markSum(tallies, "counted")}`;
  return db
    .select({
      studentId: students.id,
      attended: sql<number>`(${attended})::integer`.as("attended"),
      counted: sql<number>`(${counted})::integer`.as("counted"),
    })
    .from(students)
    .leftJoin(activities, eq(activities.studentId, students.id))
    .leftJoin(tallies, eq(tallies.studentId, students.id))
    .where(and(ACTIVE_MEMBER, visible))
    .as("attendance_sums");
}
