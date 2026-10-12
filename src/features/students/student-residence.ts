import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { studentSemester } from "@/academic-periods/student-semester";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { DormId } from "@/dorms/dorms";
import { dormOf, type ResidentFacts } from "@/dorms/resident-rule";
import { readStudentRoom, type StudentRoom } from "@/dorms/student-room";

/** The room of a resident, or that they have none yet. */
export type ResidentRoom =
  | ({ plotted: true } & StudentRoom)
  | { plotted: false };

/** Where a resident lives, as far as the account that asks is shown. */
export interface StudentResidence {
  dorm: DormId;
  /** Null when the floor and the room are not shown: they are not read. */
  room: ResidentRoom | null;
}

/**
 * The dorms whose floor and room the detail shows. A resident of Asrama
 * Wismantara shows the dorm only, to every role.
 */
const DORMS_WITH_ROOM_SHOWN: readonly DormId[] = ["dana_rakca", "cipta_bakti"];

function showsRoom(account: AccountForAccess, dorm: DormId): boolean {
  if (!may(account.roles, "view_student_room")) return false;
  return DORMS_WITH_ROOM_SHOWN.includes(dorm);
}

async function readResidentRoom(
  db: Database,
  studentId: string,
  dorm: DormId,
): Promise<ResidentRoom> {
  const room = await readStudentRoom(db, studentId, dorm);
  return room ? { plotted: true, ...room } : { plotted: false };
}

type StudentToPlace = ResidentFacts & { id: string; cohortYear: number };

/**
 * Where a student lives on a day, today when none is given, for the
 * account that asks. Null for a student who lives in no dorm. While no
 * academic period runs no semester is known, as everywhere the resident
 * rule is read.
 */
export async function readStudentResidence(
  db: Database,
  account: AccountForAccess,
  student: StudentToPlace,
  day?: string,
): Promise<StudentResidence | null> {
  const period = await readRunningPeriod(db, day);
  const semester = period ? studentSemester(student.cohortYear, period) : null;
  const dorm = dormOf(student, semester);
  if (dorm === null) return null;
  if (!showsRoom(account, dorm)) return { dorm, room: null };
  return { dorm, room: await readResidentRoom(db, student.id, dorm) };
}
