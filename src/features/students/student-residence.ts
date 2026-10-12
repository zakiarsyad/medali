import { studentSemester } from "@/academic-periods/student-semester";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { DormId } from "@/dorms/dorms";
import { dormOf, type ResidentFacts } from "@/dorms/resident-rule";
import { readStudentRoom, type StudentRoom } from "@/dorms/student-room";
import type { RunningPeriod } from "./semester-now";

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
 * Where a student lives in the running academic period. Null for a student
 * who lives in no dorm. While no period runs no semester is known, as
 * everywhere the resident rule is read.
 */
async function readResidence(
  db: Database,
  student: StudentToPlace,
  period: RunningPeriod,
  mayBeShownRoom: boolean,
): Promise<StudentResidence | null> {
  const semester = period ? studentSemester(student.cohortYear, period) : null;
  const dorm = dormOf(student, semester);
  if (dorm === null) return null;
  const showsRoom = mayBeShownRoom && DORMS_WITH_ROOM_SHOWN.includes(dorm);
  if (!showsRoom) return { dorm, room: null };
  return { dorm, room: await readResidentRoom(db, student.id, dorm) };
}

/** Where a student lives, as far as the account that asks is shown. */
export function readStudentResidence(
  db: Database,
  account: AccountForAccess,
  student: StudentToPlace,
  period: RunningPeriod,
): Promise<StudentResidence | null> {
  const mayBeShownRoom = may(account.roles, "view_student_room");
  return readResidence(db, student, period, mayBeShownRoom);
}

/**
 * Where a student lives, with their room. It does not ask who is reading:
 * call it only for the student record of the account itself. The right to
 * see the floor and the room is about other students, not one's own.
 */
export function readOwnResidence(
  db: Database,
  student: StudentToPlace,
  period: RunningPeriod,
): Promise<StudentResidence | null> {
  return readResidence(db, student, period, true);
}
