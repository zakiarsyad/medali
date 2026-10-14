import { and, desc, eq, lte } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { activitySchedules, ppksActivities } from "@/db/schema";
import type { RecordActivity } from "./manual-record";
import { mayVerify } from "./may-verify";
import { semestersByPeriod } from "./participants";
import { readActiveStudent } from "./record-student";
import { meantFor, readOwnAttendances } from "./student-schedules";
import { choiceWords } from "./verification-choices";

/**
 * The most activities offered for one student. A student has far fewer
 * over all their semesters; the limit only keeps a faulty list short.
 */
export const RECORD_ACTIVITIES_MAX = 100;

/**
 * The activities of one student that have started by the day of `at` on
 * campus: the schedules meant for them that are not removed, over every
 * period, the newest first, each with the status the student has there.
 * For an account that may verify attendance; anyone else gets none, and
 * so does a key of no Aktif student. `studentId` comes from outside.
 */
export async function readRecordActivities(
  db: Database,
  account: AccountForAccess,
  studentId: unknown,
  at: Date,
): Promise<RecordActivity[]> {
  if (!mayVerify(account)) return [];
  const student = await readActiveStudent(db, studentId);
  if (student === null) return [];
  const periods = await readAcademicPeriods(db);
  const semesters = semestersByPeriod(student.cohortYear, periods);
  const meant = meantFor(semesters, student);
  const schedules = await db
    .select({
      id: activitySchedules.id,
      startsOn: activitySchedules.startsOn,
      name: ppksActivities.name,
      semester: ppksActivities.semester,
    })
    .from(activitySchedules)
    .innerJoin(
      ppksActivities,
      eq(ppksActivities.id, activitySchedules.activityId),
    )
    .where(and(meant, lte(activitySchedules.startsOn, campusDay(at))))
    .orderBy(desc(activitySchedules.startsOn), desc(activitySchedules.id))
    .limit(RECORD_ACTIVITIES_MAX);
  const attendances = await readOwnAttendances(
    db,
    student.id,
    schedules.map((schedule) => schedule.id),
  );
  return schedules.map(({ id, startsOn, name, semester }) => ({
    id,
    words: choiceWords(startsOn, name, semester),
    status: attendances.get(id)?.status ?? null,
  }));
}
