import { asc, eq } from "drizzle-orm";
import { daysAfter } from "@/academic-periods/days-after";
import { studentSemester } from "@/academic-periods/student-semester";
import { dormOf } from "@/dorms/resident-rule";
import { loggedMarks } from "@/features/dorm/count-marks";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  type KeptSampleActivity,
  type SampleCount,
  type SampleResident,
  sampleDormCounts,
} from "./sample-dorm-counts";
import {
  accountRoles,
  dormAttendanceChanges,
  dormAttendanceCounts,
  dormAttendanceMarks,
  students,
} from "./schema";

/** Half an hour after a sample activity ended, on campus. */
function afterEnd(count: SampleCount): Date {
  const ended = new Date(`${count.day}T${count.endTime}:00+07:00`);
  return new Date(ended.getTime() + 30 * 60 * 1000);
}

/** Eight in the morning on campus, the day after a sample activity. */
function nextMorning(count: SampleCount): Date {
  return new Date(`${daysAfter(count.day, 1)}T08:00:00+07:00`);
}

/** The residents of the running sample period, by name. */
export async function sampleResidents(
  db: Database,
  period: SamplePeriod,
): Promise<SampleResident[]> {
  const residents: SampleResident[] = [];
  const all = await db.select().from(students).orderBy(asc(students.name));
  for (const student of all) {
    const dorm = dormOf(student, studentSemester(student.cohortYear, period));
    if (dorm !== null) residents.push({ id: student.id, dorm });
  }
  return residents;
}

/** The sample BAM - BPHK account, who makes the sample counts. */
async function sampleCounter(db: Database): Promise<string> {
  const [counter] = await db
    .select({ id: accountRoles.accountId })
    .from(accountRoles)
    .where(eq(accountRoles.role, "bam_bphk"))
    .limit(1);
  if (!counter) throw new Error("There is no sample BAM - BPHK account.");
  return counter.id;
}

async function addCount(
  db: Database,
  count: SampleCount,
  by: string,
): Promise<void> {
  const firstSaved = afterEnd(count);
  const savedAt = count.stage === "corrected" ? nextMorning(count) : firstSaved;
  const announcement =
    count.stage === "draft" ? {} : { announcedBy: by, announcedAt: savedAt };
  const [added] = await db
    .insert(dormAttendanceCounts)
    .values({
      activityId: count.activityId,
      day: count.day,
      version: count.stage === "corrected" ? 2 : 1,
      savedBy: by,
      savedAt,
      ...announcement,
    })
    .returning({ id: dormAttendanceCounts.id });
  if (!added) throw new Error("A sample count was not added.");
  const marks = Object.entries(count.marks).map(([studentId, mark]) => ({
    countId: added.id,
    studentId,
    ...mark,
  }));
  if (marks.length > 0) await db.insert(dormAttendanceMarks).values(marks);
  if (count.stage === "draft") return;

  const after = loggedMarks(count.marks);
  if (count.firstMarks === null) {
    await db.insert(dormAttendanceChanges).values({
      countId: added.id,
      changedBy: by,
      changedAt: savedAt,
      marksAfter: after,
    });
    return;
  }
  const first = loggedMarks(count.firstMarks);
  await db.insert(dormAttendanceChanges).values([
    {
      countId: added.id,
      changedBy: by,
      changedAt: firstSaved,
      marksAfter: first,
    },
    {
      countId: added.id,
      changedBy: by,
      changedAt: savedAt,
      marksBefore: first,
      marksAfter: after,
    },
  ]);
}

/**
 * Adds the sample counts of the week before today for the sample dorm
 * activities, with their marks and the log of their announcements, as
 * the work of the sample BAM - BPHK. The residents are those of the
 * running sample period. `day` is today on campus.
 */
export async function addSampleDormCounts(
  db: Database,
  activities: KeptSampleActivity[],
  period: SamplePeriod,
  day: string,
): Promise<void> {
  const residents = await sampleResidents(db, period);
  const counter = await sampleCounter(db);
  for (const count of sampleDormCounts(day, activities, residents)) {
    await addCount(db, count, counter);
  }
}
