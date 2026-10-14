import { and, asc, count, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import { may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { activityScheduleParticipants as chosen, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { RecordStudent } from "./manual-record";
import type { ClassCount, PickedStudent } from "./participant-draft";
import { findActiveStudents } from "./record-student";

/**
 * How many Aktif students each class has, by class name. Only numbers
 * leave the database, and nobody is named.
 */
export async function readClassCounts(db: Database): Promise<ClassCount[]> {
  const rows = await db
    .select({ className: students.className, students: count() })
    .from(students)
    .where(and(ACTIVE_MEMBER, isNotNull(students.className)))
    .groupBy(students.className)
    .orderBy(asc(students.className));
  const counts: ClassCount[] = [];
  for (const { className, students: heads } of rows) {
    if (className !== null) counts.push({ className, students: heads });
  }
  return counts;
}

/**
 * The students each of some schedules names one by one, by name, with
 * whether they are Aktif, by the key of the schedule. Read only for the
 * form of an account that may manage activities, so it can change them.
 */
export async function readPickedStudents(
  db: Database,
  scheduleIds: readonly string[],
): Promise<Record<string, PickedStudent[]>> {
  const picked: Record<string, PickedStudent[]> = {};
  if (scheduleIds.length === 0) return picked;
  const rows = await db
    .select({
      scheduleId: chosen.scheduleId,
      id: students.id,
      name: students.name,
      nim: students.nim,
      isActive: sql<boolean>`(${ACTIVE_MEMBER})`,
    })
    .from(chosen)
    .innerJoin(students, eq(students.id, chosen.studentId))
    .where(inArray(chosen.scheduleId, [...scheduleIds]))
    .orderBy(asc(students.name), asc(students.nim));
  for (const { scheduleId, ...student } of rows) {
    picked[scheduleId] = [...(picked[scheduleId] ?? []), student];
  }
  return picked;
}

/**
 * The Aktif students whose name or NIM holds the text, for Per mahasiswa
 * on the form of an account that may manage activities. Anyone else is
 * offered nobody.
 */
export async function searchParticipantStudents(
  db: Database,
  account: AccountForAccess,
  query: unknown,
): Promise<RecordStudent[]> {
  if (!may(account.roles, "manage_activities")) return [];
  return findActiveStudents(db, query);
}
