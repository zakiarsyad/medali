import { and, eq, isNull } from "drizzle-orm";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { readCompanionDorm } from "@/dorms/companion-dorm";
import type { DormId } from "@/dorms/dorms";
import { dormOf } from "@/dorms/resident-rule";

/**
 * The dorm one student lives in on a day, today when none is given: the
 * one they serve while they are an Aktif kakak pendamping. Null
 * for a student who does not live in a dorm, is removed or is not found.
 */
export async function readStudentDorm(
  db: Database,
  studentId: string,
  day?: string,
): Promise<DormId | null> {
  const [student] = await db
    .select({
      status: students.status,
      entryPath: students.entryPath,
      sex: students.sex,
      isInternational: students.isInternational,
      isSeedling: students.isSeedling,
      cohortYear: students.cohortYear,
    })
    .from(students)
    .where(and(eq(students.id, studentId), isNull(students.deletedAt)))
    .limit(1);
  if (!student) return null;
  const period = await readRunningPeriod(db, day);
  const semester = period ? studentSemester(student.cohortYear, period) : null;
  return dormOf(student, semester, await readCompanionDorm(db, studentId));
}
