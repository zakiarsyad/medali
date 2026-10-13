import { firstAccountWithRole } from "@/auth/accounts";
import type { Database } from "./connect";
import { sampleActivityAttendances } from "./sample-activity-attendances";
import type { SampleStudent } from "./sample-students";
import { activityAttendances } from "./schema";
import type { AddedSchedule } from "./seed-activity-schedules";
import { studentIdsByNim } from "./seed-mentor-groups";

function found<Value>(value: Value | undefined, what: string): Value {
  if (value === undefined) {
    throw new Error(`A sample attendance names a ${what} that is missing.`);
  }
  return value;
}

/**
 * Adds the sample attendance of the sample students at the sample
 * schedules, decided by the sample Pegawai UPK. The students, the
 * schedules and the accounts must be there already. `day` is today on
 * campus.
 */
export async function addSampleActivityAttendances(
  db: Database,
  schedules: AddedSchedule[],
  students: SampleStudent[],
  day: string,
): Promise<void> {
  const samples = schedules.map((schedule) => schedule.sample);
  const attendances = sampleActivityAttendances(samples, students, day);
  if (attendances.length === 0) return;
  const studentIds = await studentIdsByNim(db);
  const scheduleIds = new Map(schedules.map(({ id, sample }) => [sample, id]));
  const decider = found(
    (await firstAccountWithRole(db, "upk_staff")) ?? undefined,
    "Pegawai UPK",
  );

  await db.insert(activityAttendances).values(
    attendances.map(({ nim, schedule, decidedAt, ...attendance }) => ({
      ...attendance,
      studentId: found(studentIds.get(nim), "student"),
      scheduleId: found(scheduleIds.get(schedule), "schedule"),
      decidedAt,
      decidedBy: decidedAt === null ? null : decider.id,
    })),
  );
}
