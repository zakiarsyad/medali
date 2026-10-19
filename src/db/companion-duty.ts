import { and, eq } from "drizzle-orm";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import type { DormId } from "@/dorms/dorms";
import { dormOf, type ResidentFacts } from "@/dorms/resident-rule";
import {
  companionDormOf,
  hasCompanions,
} from "@/features/dorm/companion-dorms";
import type { Database } from "./connect";
import { dormCompanions, students } from "./schema";

/*
 * Kept here because two areas end a duty: the dorm, and the student data
 * when a student changes so that they can no longer be kakak pendamping.
 */

/** What the rule needs to know of the student of a kakak pendamping. */
export type DutyFacts = ResidentFacts & { deletedAt: Date | null };

/** Why a student cannot be kakak pendamping of a dorm. */
export type DutyBar =
  | "removed"
  | "not_active"
  | "lives_with_companions"
  | "wrong_dorm";

/**
 * Why a student cannot be, or go on being, kakak pendamping of a dorm in
 * a semester, or null when they can: the one rule that ends a duty and
 * that refuses to start one again. A resident of a dorm that has kakak
 * pendamping cannot be one. A resident of Wismantara can. The dorm they
 * live in is that of the usual rule, as if they were no kakak pendamping.
 */
export function dutyBar(
  student: DutyFacts,
  dorm: DormId,
  semester: number | null,
): DutyBar | null {
  if (student.deletedAt !== null) return "removed";
  if (student.status !== "active") return "not_active";
  const home = dormOf(student, semester, null, null);
  if (home !== null && hasCompanions(home)) return "lives_with_companions";
  if (dorm !== companionDormOf(student.sex)) return "wrong_dorm";
  return null;
}

/**
 * The semester a student of an angkatan is in on a day, today when none
 * is given. Null while no academic period runs.
 */
export async function readSemester(
  db: Database,
  cohortYear: number,
  day?: string,
): Promise<number | null> {
  const period = await readRunningPeriod(db, day);
  return period ? studentSemester(cohortYear, period) : null;
}

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
 * fits it: the student is removed or not active, lives in Dana Rakca or
 * Cipta Bakti on the day, today when none is given, or is not of the
 * jenis kelamin of the dorm they serve. Called after every change to a
 * student, so nobody is kakak pendamping and resident of those two at
 * once.
 */
export async function settleCompanionDuty(
  db: Database,
  studentId: string,
  day?: string,
): Promise<void> {
  const duty = await readActiveDuty(db, studentId);
  if (!duty) return;
  const semester = await readSemester(db, duty.cohortYear, day);
  if (dutyBar(duty, duty.dorm, semester) !== null) {
    await endCompanionDuty(db, studentId);
  }
}
