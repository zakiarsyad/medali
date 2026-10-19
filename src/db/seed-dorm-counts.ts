import { asc, eq } from "drizzle-orm";
import { studentSemester } from "@/academic-periods/student-semester";
import { dormOf } from "@/dorms/resident-rule";
import { loggedMarks } from "@/features/dorm/count-marks";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  afterEnd,
  type KeptSampleActivity,
  type KeptSampleCount,
  nextMorning,
  type SampleCount,
  type SampleResident,
  sampleDormCounts,
} from "./sample-dorm-counts";
import { sampleCompanionDorm } from "./sample-dorms";
import {
  accountRoles,
  dormAttendanceChanges,
  dormAttendanceCounts,
  dormAttendanceMarks,
  students,
} from "./schema";

/** The residents of the running sample period, by name. */
export async function sampleResidents(
  db: Database,
  period: SamplePeriod,
): Promise<SampleResident[]> {
  const residents: SampleResident[] = [];
  const all = await db.select().from(students).orderBy(asc(students.name));
  for (const student of all) {
    const semester = studentSemester(student.cohortYear, period);
    const dorm = dormOf(student, semester, sampleCompanionDorm(student.nim));
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

/** Adds a sample count with its marks and log lines. Gives back its key. */
async function addCount(
  db: Database,
  count: SampleCount,
  by: string,
): Promise<string> {
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
  if (count.stage === "draft") return added.id;

  const after = loggedMarks(count.marks);
  if (count.firstMarks === null) {
    await db.insert(dormAttendanceChanges).values({
      countId: added.id,
      changedBy: by,
      changedAt: savedAt,
      marksAfter: after,
    });
    return added.id;
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
  return added.id;
}

/**
 * Adds the sample counts of the week before today for the sample dorm
 * activities, with their marks and the log of their announcements, as
 * the work of the sample BAM - BPHK, and gives them back with their keys.
 * The residents are those of the running sample period. `day` is today
 * on campus.
 */
export async function addSampleDormCounts(
  db: Database,
  activities: KeptSampleActivity[],
  period: SamplePeriod,
  day: string,
): Promise<KeptSampleCount[]> {
  const residents = await sampleResidents(db, period);
  const counter = await sampleCounter(db);
  const kept: KeptSampleCount[] = [];
  for (const count of sampleDormCounts(day, activities, residents)) {
    kept.push({ id: await addCount(db, count, counter), count });
  }
  return kept;
}
