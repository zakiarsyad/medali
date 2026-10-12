import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { RunningPeriod } from "./semester-now";
import { type StudentFacts, selectStudentFacts } from "./student-facts";
import {
  readStudentMentorGroup,
  type ShownMentorGroup,
  shownPartOf,
} from "./student-mentor-group";
import { readOwnResidence, type StudentResidence } from "./student-residence";
import { visibleTo } from "./visible-students";

/** What Profil saya shows of the student of the account. */
export interface OwnProfile extends StudentFacts {
  /** Null for a student who is in no kelompok pengasuhan. */
  mentorGroup: ShownMentorGroup | null;
  /** Null for a student who lives in no dorm. */
  residence: StudentResidence | null;
}

export type OwnProfileAnswer =
  | { kind: "refused" }
  | { kind: "found"; student: OwnProfile };

const REFUSED = { kind: "refused" } as const;

async function readOwnMentorGroup(
  db: Database,
  studentId: string,
): Promise<ShownMentorGroup | null> {
  const group = await readStudentMentorGroup(db, studentId);
  if (group === null) return null;
  return shownPartOf(group);
}

/**
 * The student record of the account itself, for Profil saya, with their
 * own kelompok pengasuhan and dorm room. Which student is never asked
 * from outside: it is the one the account's own rows hold. An account
 * without the right is refused, and so is one with the right and no
 * record to show: no student record, or a removed one. The running
 * academic period says whether the student lives in the dorm.
 */
export async function readOwnProfile(
  db: Database,
  account: AccountForAccess,
  period: RunningPeriod,
): Promise<OwnProfileAnswer> {
  if (!may(account.roles, "view_own_profile")) return REFUSED;
  const own = visibleTo(rowLimitForAction(account, "view_own_profile"));
  // Two are asked for so that rows which hold more than the account's own
  // student, as a wider role's would, are refused and not shown.
  const found = await selectStudentFacts(db).where(own).limit(2);
  const [student] = found;
  if (!student || found.length > 1) return REFUSED;
  const [mentorGroup, residence] = await Promise.all([
    readOwnMentorGroup(db, student.id),
    readOwnResidence(db, student, period),
  ]);
  return { kind: "found", student: { ...student, mentorGroup, residence } };
}
