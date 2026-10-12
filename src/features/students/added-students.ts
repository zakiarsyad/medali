import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/db/connect";
import {
  accounts,
  studentBatchFiles,
  students,
  studyPrograms,
} from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import { countWhere, matchesSearch, NOT_REMOVED } from "./student-conditions";
import type { StudentInput } from "./student-input";

/** The most rows the list shows. More than that is found by searching. */
export const LIST_LIMIT = 100;

const inputter = alias(accounts, "inputter");

const ROW = {
  nim: students.nim,
  name: students.name,
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
}

export interface StudentCounts {
  total: number;
  active: number;
  /** Put in through Pengguna baru mahasiswa. */
  added: number;
  addedActive: number;
  /** Those put in here who live in a dorm today. */
  addedResidents: number;
}

const putInHere = isNotNull(students.inputAt);
const isActive = eq(students.status, "active");

/** A student put in through Pengguna baru mahasiswa and not removed. */
export const ADDED_HERE = and(putInHere, NOT_REMOVED);

/**
 * The students put in through Pengguna baru mahasiswa that match a search,
 * the newest first: at most `LIST_LIMIT` rows, and how many match in all.
 * `dormCohorts` are the angkatan years that live in the dorm today.
 */
export async function listAddedStudents(
  db: Database,
  query: string,
  dormCohorts: number[],
): Promise<{ students: AddedStudent[]; matching: number }> {
  const condition = and(ADDED_HERE, matchesSearch(query));
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .where(condition);
  const rows = await db
    .select({ ...ROW, dorm: dormInSql(dormCohorts) })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(inputter, eq(inputter.id, students.inputBy))
    .leftJoin(
      studentBatchFiles,
      eq(studentBatchFiles.batchId, students.inputBatchId),
    )
    .where(condition)
    .orderBy(desc(students.inputAt), asc(students.name))
    .limit(LIST_LIMIT);
  return { students: rows, matching: counted?.matching ?? 0 };
}

const INPUT = {
  nim: students.nim,
  name: students.name,
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
};

/**
 * What the form holds for one student put in through Pengguna baru
 * mahasiswa, or null when there is no such student or they were removed.
 */
export async function findAddedStudent(
  db: Database,
  nim: string,
): Promise<StudentInput | null> {
  const [found] = await db
    .select(INPUT)
    .from(students)
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
  const [counted] = await db
    .select({
      total: count(),
      active: countWhere(isActive),
      added: countWhere(putInHere),
      addedActive: countWhere(sql`${putInHere} and ${isActive}`),
      addedResidents: countWhere(sql`${putInHere} and ${isResident}`),
    })
    .from(students)
    .where(NOT_REMOVED);
  if (!counted) throw new Error("The students were not counted.");
  return counted;
}
