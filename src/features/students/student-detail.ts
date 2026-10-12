import { and, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students, studyPrograms } from "@/db/schema";
import type { RunningPeriod } from "./semester-now";
import {
  readStudentMentorGroup,
  type StudentMentorGroup,
} from "./student-mentor-group";
import {
  readStudentResidence,
  type StudentResidence,
} from "./student-residence";
import { detailVisibleTo } from "./visible-students";

type Student = typeof students.$inferSelect;

/** What the detail of one student shows. */
export interface StudentDetail {
  id: string;
  nim: string;
  name: string;
  status: Student["status"];
  isAffirmation: boolean;
  isSeedling: boolean;
  isInternational: boolean;
  isBlended: boolean;
  studyProgram: string;
  entryPath: Student["entryPath"];
  originAgency: string | null;
  cohortYear: number;
  className: string | null;
  province: string | null;
  sex: Student["sex"];
  /** Null for a student who is in no kelompok pengasuhan. */
  mentorGroup: StudentMentorGroup | null;
  /** Null for a student who lives in no dorm. */
  residence: StudentResidence | null;
}

const DETAIL = {
  id: students.id,
  nim: students.nim,
  name: students.name,
  status: students.status,
  isAffirmation: students.isAffirmation,
  isSeedling: students.isSeedling,
  isInternational: students.isInternational,
  isBlended: students.isBlended,
  studyProgram: studyPrograms.name,
  entryPath: students.entryPath,
  originAgency: students.originAgency,
  cohortYear: students.cohortYear,
  className: students.className,
  province: students.province,
  sex: students.sex,
};

export type StudentDetailAnswer =
  | { kind: "refused" }
  | { kind: "not_found" }
  | { kind: "found"; student: StudentDetail };

const NOT_FOUND = { kind: "not_found" } as const;

/**
 * The detail of one student, for an account. An account without the right
 * is refused. Every student the account cannot be shown gets the one
 * answer "not found": one who does not exist, one who was removed, and one
 * outside the account's rows, so that nobody learns from the answer
 * whether a student they may not see exists. The running academic period
 * says whether the student lives in the dorm.
 */
export async function readStudentDetail(
  db: Database,
  account: AccountForAccess,
  id: string,
  period: RunningPeriod,
): Promise<StudentDetailAnswer> {
  const visible = detailVisibleTo(account);
  if (visible === null) return { kind: "refused" };
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return NOT_FOUND;
  const [student] = await db
    .select(DETAIL)
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(eq(students.id, id), visible));
  if (!student) return NOT_FOUND;
  const [mentorGroup, residence] = await Promise.all([
    readStudentMentorGroup(db, student.id),
    readStudentResidence(db, account, student, period),
  ]);
  return { kind: "found", student: { ...student, mentorGroup, residence } };
}
