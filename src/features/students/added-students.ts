import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  studentBatchFiles,
  students,
  studyPrograms,
} from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import {
  GROUP_COLUMNS,
  GROUP_IN_FORCE,
  GROUP_MENTOR,
  GROUP_PROGRAM,
  type GroupColumns,
  groupMentor,
  groupProgram,
  HELD_TODAY,
  IN_NO_GROUP,
  IS_MEMBER,
  type ListedGroup,
  listedGroupOf,
} from "./listed-group";
import { countWhere, matchesSearch } from "./student-conditions";
import type { StoredStudent } from "./student-input";

const inputter = alias(accounts, "inputter");

const ROW = {
  nim: students.nim,
  name: students.name,
  email: accounts.email,
  sex: students.sex,
  studyProgram: studyPrograms.name,
  entryPath: students.entryPath,
  className: students.className,
  cohortYear: students.cohortYear,
  status: students.status,
  isAffirmation: students.isAffirmation,
  isSeedling: students.isSeedling,
  isInternational: students.isInternational,
  isBlended: students.isBlended,
  inputAt: students.inputAt,
  inputBy: inputter.name,
  inputSource: students.inputSource,
  fileId: studentBatchFiles.id,
};

export interface AddedStudent {
  nim: string;
  name: string;
  /** The campus address of the student's account, when it holds one. */
  email: string | null;
  sex: typeof students.$inferSelect.sex;
  studyProgram: string;
  entryPath: typeof students.$inferSelect.entryPath;
  className: string | null;
  cohortYear: number;
  status: typeof students.$inferSelect.status;
  isAffirmation: boolean;
  isSeedling: boolean;
  isInternational: boolean;
  isBlended: boolean;
  inputAt: Date | null;
  /** The name of the account that put the data in. */
  inputBy: string | null;
  inputSource: typeof students.$inferSelect.inputSource;
  /** The kept file the student was saved from, when one was kept. */
  fileId: string | null;
  /** The dorm the student lives in today. Null for one who lives in none. */
  dorm: DormId | null;
  /** The group in force the student is in. Null for one who is in none. */
  group: ListedGroup | null;
}

export interface StudentCounts {
  total: number;
  active: number;
  /** Put in through Pengguna baru mahasiswa. */
  added: number;
  addedActive: number;
  /** Those put in here who live in a dorm today. */
  addedResidents: number;
  /** The Aktif ones put in here who are in no group in force. */
  addedWithoutGroup: number;
}

const putInHere = isNotNull(students.inputAt);
const isActive = eq(students.status, "active");

/** A student put in through Pengguna baru mahasiswa and not removed. */
export const ADDED_HERE = and(putInHere, NOT_REMOVED);

type StoredRow = Omit<AddedStudent, "group"> & GroupColumns;

/** One row with its group columns gathered into the group they tell of. */
function withGroup(row: StoredRow): AddedStudent {
  const {
    groupCohortYear,
    groupEntryPath,
    groupNumber,
    groupProgramCode,
    groupMentorName,
    ...student
  } = row;
  return { ...student, group: listedGroupOf(row) };
}

export interface AddedStudentPage {
  students: AddedStudent[];
  /** How many students match in all. */
  matching: number;
  /** The page given, counted from 1: the last one when there are fewer. */
  page: number;
}

/**
 * One page of the students put in through Pengguna baru mahasiswa that
 * match a search, the newest first, and how many match in all. Each comes
 * with their group in force, joined in the same read. `dormCohorts` are
 * the angkatan years that live in the dorm today.
 */
export async function listAddedStudents(
  db: Database,
  query: string,
  dormCohorts: number[],
  page = 1,
): Promise<AddedStudentPage> {
  const condition = and(ADDED_HERE, matchesSearch(query));
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .where(condition);
  const matching = counted?.matching ?? 0;
  const given = pageWithin(page, matching);
  if (matching === 0) return { students: [], matching, page: given };

  const rows = await db
    .select({ ...ROW, ...GROUP_COLUMNS, dorm: dormInSql(dormCohorts) })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(accounts, eq(accounts.studentId, students.id))
    .leftJoin(inputter, eq(inputter.id, students.inputBy))
    .leftJoin(
      studentBatchFiles,
      eq(studentBatchFiles.batchId, students.inputBatchId),
    )
    .leftJoin(mentorGroupMembers, IS_MEMBER)
    .leftJoin(mentorGroups, GROUP_IN_FORCE)
    .leftJoin(groupProgram, GROUP_PROGRAM)
    .leftJoin(mentorGroupMentors, HELD_TODAY)
    .leftJoin(groupMentor, GROUP_MENTOR)
    .where(condition)
    // The NIM last, so that rows alike in the rest keep one place each and
    // none shows on two pages.
    .orderBy(desc(students.inputAt), asc(students.name), asc(students.nim))
    .limit(PAGE_SIZE)
    .offset((given - 1) * PAGE_SIZE);
  return { students: rows.map(withGroup), matching, page: given };
}

const INPUT = {
  nim: students.nim,
  name: students.name,
  email: accounts.email,
  studyProgramId: students.studyProgramId,
  entryPath: students.entryPath,
  sex: students.sex,
  cohortYear: students.cohortYear,
  className: students.className,
  province: students.province,
  originAgency: students.originAgency,
  status: students.status,
  isAffirmation: students.isAffirmation,
  isSeedling: students.isSeedling,
  isInternational: students.isInternational,
  isBlended: students.isBlended,
  mentorGroupId: mentorGroupMembers.groupId,
  version: students.version,
};

/**
 * What the form holds for one student put in through Pengguna baru
 * mahasiswa, with the group they are in, or null when there is no such
 * student or they were removed.
 */
export async function findAddedStudent(
  db: Database,
  nim: string,
): Promise<StoredStudent | null> {
  const [found] = await db
    .select(INPUT)
    .from(students)
    .leftJoin(accounts, eq(accounts.studentId, students.id))
    .leftJoin(mentorGroupMembers, eq(mentorGroupMembers.studentId, students.id))
    .where(and(eq(students.nim, nim), ADDED_HERE))
    .limit(1);
  return found ?? null;
}

/**
 * The numbers at the top of Pengguna baru mahasiswa. Removed students are
 * left out. `dormCohorts` are the angkatan years that live in the dorm today.
 */
export async function countStudents(
  db: Database,
  dormCohorts: number[],
): Promise<StudentCounts> {
  const isResident = sql`${dormInSql(dormCohorts)} is not null`;
  const addedActive = sql`${putInHere} and ${isActive}`;
  const [counted] = await db
    .select({
      total: count(),
      active: countWhere(isActive),
      added: countWhere(putInHere),
      addedActive: countWhere(addedActive),
      addedResidents: countWhere(sql`${putInHere} and ${isResident}`),
      addedWithoutGroup: countWhere(sql`${addedActive} and ${IN_NO_GROUP}`),
    })
    .from(students)
    // A student is in one group at most, so these add no rows to count.
    .leftJoin(mentorGroupMembers, IS_MEMBER)
    .leftJoin(mentorGroups, GROUP_IN_FORCE)
    .where(NOT_REMOVED);
  if (!counted) throw new Error("The students were not counted.");
  return counted;
}
