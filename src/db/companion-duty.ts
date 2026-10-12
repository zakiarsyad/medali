import { and, eq } from "drizzle-orm";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import { companionDormOf } from "@/features/dorm/companion-dorms";
import { dormOf } from "@/features/dorm/resident-rule";
import type { Database } from "./connect";
import { dormCompanions, students } from "./schema";

/*
 * Kept here because two areas end a duty: the dorm, and the student data
 * when a student changes so that they can no longer be kakak pendamping.
 */

/**
 * Ends the duty of a kakak pendamping: Tidak aktif, and out of their room.
 * It stays ended until someone starts it again. Nothing happens for a
 * student who is not an active kakak pendamping.
 */
export async function endCompanionDuty(
  db: Database,
  studentId: string,
): Promise<void> {
  await db
    .update(dormCompanions)
    .set({ isActive: false, roomId: null })
    .where(
      and(
        eq(dormCompanions.studentId, studentId),
        eq(dormCompanions.isActive, true),
      ),
    );
}

async function readActiveDuty(db: Database, studentId: string) {
  const [duty] = await db
    .select({
      dorm: dormCompanions.dorm,
      status: students.status,
      entryPath: students.entryPath,
      sex: students.sex,
      isInternational: students.isInternational,
      isSeedling: students.isSeedling,
      cohortYear: students.cohortYear,
      deletedAt: students.deletedAt,
    })
    .from(dormCompanions)
    .innerJoin(students, eq(students.id, dormCompanions.studentId))
    .where(
      and(
        eq(dormCompanions.studentId, studentId),
        eq(dormCompanions.isActive, true),
      ),
    )
    .limit(1);
  return duty ?? null;
}

/**
 * Ends the duty of an active kakak pendamping whose student data no longer
 * fits it: the student is removed or not active, lives in a dorm on the
 * day, today when none is given, or is not of the jenis kelamin of the
 * dorm they serve. Called after every change to a student, so nobody is
 * kakak pendamping and resident at once.
 */
export async function settleCompanionDuty(
  db: Database,
  studentId: string,
  day?: string,
): Promise<void> {
  const duty = await readActiveDuty(db, studentId);
  if (!duty) return;
  const period = await readRunningPeriod(db, day);
  const semester = period ? studentSemester(duty.cohortYear, period) : null;
  const stillFits =
    duty.deletedAt === null &&
    duty.status === "active" &&
    dormOf(duty, semester) === null &&
    duty.dorm === companionDormOf(duty.sex);
  if (!stillFits) await endCompanionDuty(db, studentId);
}
