import { and, asc, eq, isNull, or, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { pageWithin } from "@/ui/list-pages";
import { meantStudents } from "./meant-students";
import { newestAt } from "./newest-attendances";
import type { CohortCount } from "./participants";
import { ABSENT_PAGE_SIZE, type AbsentList } from "./schedule-attendance";
import type { ScheduleRow } from "./schedule-row";

type Opened = Pick<ScheduleRow, "id" | "target" | "period">;

/**
 * "Peserta" of one schedule: how many Aktif students it is meant for,
 * and one page of those who did not attend, by name, 40 a page: the
 * students with nothing sent and those whose newest photo was rejected.
 * `visible` limits the students to those the account sees, so Ketua
 * Program Studi and Pengasuh are shown their own students only. Whether
 * the schedule is listed and has started is checked by the caller.
 */
export async function readAbsent(
  db: Database,
  visible: SQL,
  schedule: Opened,
  cohorts: readonly CohortCount[],
  page: number,
): Promise<AbsentList> {
  const meantByIt = meantStudents(schedule, cohorts);
  const empty = { scheduleId: schedule.id, targeted: 0, absent: 0 };
  if (meantByIt === undefined) return { ...empty, students: [], page: 1 };

  const newest = newestAt(db, [schedule.id]);
  const meant = and(ACTIVE_MEMBER, visible, meantByIt);
  const isAbsent = or(isNull(newest.status), eq(newest.status, "rejected"));
  const ofStudent = eq(newest.studentId, students.id);
  const [counted] = await db
    .select({
      targeted: sql<number>`count(*)::int`,
      absent: sql<number>`count(*) filter (where ${isAbsent})::int`,
    })
    .from(students)
    .leftJoin(newest, ofStudent)
    .where(meant);
  const { targeted, absent } = counted ?? empty;
  const shownPage = pageWithin(page, absent, ABSENT_PAGE_SIZE);
  const rows = await db
    .select({ name: students.name, nim: students.nim })
    .from(students)
    .leftJoin(newest, ofStudent)
    .where(and(meant, isAbsent))
    .orderBy(asc(students.name), asc(students.nim))
    .limit(ABSENT_PAGE_SIZE)
    .offset((shownPage - 1) * ABSENT_PAGE_SIZE);
  return {
    scheduleId: schedule.id,
    targeted,
    absent,
    students: rows,
    page: shownPage,
  };
}
