import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import { readStoredLatestOf } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import {
  readAchievementParts,
  type ShownStudent,
  type StudentAchievement,
  semesterOn,
} from "./student-achievement";

const RIGHT = "view_own_character_achievement";

/** The student record of an account, as the own character cards read it. */
export type OwnStudent = ShownStudent & { id: string };

/**
 * The student of the account itself, or null for an account without the
 * right or without a record. Which student is never asked from outside:
 * it is the one the account's own rows hold.
 */
export async function readOwnStudent(
  db: Database,
  account: AccountForAccess,
): Promise<OwnStudent | null> {
  if (!may(account.roles, RIGHT)) return null;
  const own = visibleTo(rowLimitForAction(account, RIGHT));
  // Two are asked for so that rows which hold more than the account's own
  // student, as a wider role's would, are refused and not shown.
  const found = await db
    .select({
      id: students.id,
      cohortYear: students.cohortYear,
      status: students.status,
    })
    .from(students)
    .where(own)
    .limit(2);
  const [student] = found;
  if (!student || found.length > 1) return null;
  return student;
}

/**
 * "Capaian karakter" of the student of the account, as of `today`, for
 * Profil saya: the same as staff see, never with "Input asesmen". Only
 * an Aktif student has a semester in the title. Under a Ringan or Sedang
 * penalty the student also gets their own scores as stored, which name
 * the strongest and the weakest value. Null for an account without the
 * right or without a student record.
 */
export async function readOwnAchievement(
  db: Database,
  account: AccountForAccess,
  today: string,
): Promise<StudentAchievement | null> {
  const student = await readOwnStudent(db, account);
  if (!student) return null;
  const isActive = student.status === "active";
  const [parts, semester] = await Promise.all([
    readAchievementParts(db, student.id),
    isActive ? semesterOn(db, student, today) : null,
  ]);
  const own = {
    studentId: student.id,
    semester,
    ...parts,
    mayAssess: false,
    own: true,
  };
  if (parts.limit === null) return own;
  const stored = await readStoredLatestOf(db, student.id);
  if (stored === null) return own;
  return { ...own, stored };
}
