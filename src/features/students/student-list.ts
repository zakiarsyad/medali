import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  students,
  studyPrograms,
} from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { dormInSql, livesIn } from "@/dorms/resident-condition";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import type { CategoryField } from "./labels";
import type { ListCohorts } from "./list-cohorts";
import { fromAgency, fromProvince, inStage } from "./stage-origin-conditions";
import { matchesSearch } from "./student-conditions";
import {
  type DormChoice,
  type EntryPath,
  NO_DORM,
  type StatusChoice,
  type StudentListFilters,
} from "./student-list-address";

type Student = typeof students.$inferSelect;

/** One row of the Mahasiswa table. */
export interface ListedStudent {
  /** The id of the record, which the address of the detail names. */
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
  /** The mentor of today of the student's group. Null without one. */
  mentorName: string | null;
  /** The dorm the student lives in today. Null for one who lives in none. */
  dorm: DormId | null;
}

const ROW = {
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
  mentorName: accounts.name,
};

/** The mentor line of today of the group a student is in. */
const HELD_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorGroupMembers.groupId),
  isNull(mentorGroupMentors.endsOn),
);

const WITH_STATUS: Record<StatusChoice, SQL | undefined> = {
  current: ne(students.status, "inactive"),
  all: undefined,
  inactive: eq(students.status, "inactive"),
};

function inCohort(year: number | null): SQL | undefined {
  return year === null ? undefined : eq(students.cohortYear, year);
}

function inProgram(id: number | null): SQL | undefined {
  return id === null ? undefined : eq(students.studyProgramId, id);
}

function byPath(path: EntryPath | null): SQL | undefined {
  return path === null ? undefined : eq(students.entryPath, path);
}

function inCategory(field: CategoryField | null): SQL | undefined {
  return field === null ? undefined : eq(students[field], true);
}

/**
 * The students of one Asrama choice: the residents of a dorm, or those
 * who live in none.
 */
export function ofDormChoice(choice: DormChoice, dormCohorts: number[]): SQL {
  if (choice === NO_DORM) return sql`${dormInSql(dormCohorts)} is null`;
  return livesIn(choice, dormCohorts);
}

function inDorm(
  choice: DormChoice | null,
  dormCohorts: number[],
): SQL | undefined {
  return choice === null ? undefined : ofDormChoice(choice, dormCohorts);
}

/**
 * The students an account may see that match every filter. The Tahapan
 * and Asrama filters read which angkatan is where now from `cohorts`.
 */
export function found(
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: ListCohorts,
): SQL | undefined {
  return and(
    visibleTo(limit),
    WITH_STATUS[filters.status],
    inCohort(filters.cohortYear),
    matchesSearch(filters.query),
    inProgram(filters.studyProgramId),
    byPath(filters.entryPath),
    inCategory(filters.category),
    inStage(filters.stageNo, cohorts.stages),
    fromProvince(filters.province),
    fromAgency(filters.originAgency),
    inDorm(filters.dorm, cohorts.dorms),
    cohorts.scored,
  );
}

export interface StudentPage {
  students: ListedStudent[];
  /** How many students match in all, on every page. */
  matching: number;
  /** The page given: the one asked for, or the last when it is past it. */
  page: number;
}

/**
 * One page of the students an account may see that match the filters, by
 * name. A student is in one group at most and a group has one mentor of
 * today at most, so the mentor joins add no row.
 */
export async function listStudents(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  page: number,
  cohorts: ListCohorts,
): Promise<StudentPage> {
  const condition = found(limit, filters, cohorts);
  const [counted] = await db
    .select({ matching: count() })
    .from(students)
    .where(condition);
  const matching = counted?.matching ?? 0;
  const given = pageWithin(page, matching);
  if (matching === 0) return { students: [], matching, page: given };
  const rows = await db
    .select({ ...ROW, dorm: dormInSql(cohorts.dorms) })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(mentorGroupMembers, eq(mentorGroupMembers.studentId, students.id))
    .leftJoin(mentorGroupMentors, HELD_TODAY)
    .leftJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(condition)
    .orderBy(asc(students.name), asc(students.nim))
    .limit(PAGE_SIZE)
    .offset((given - 1) * PAGE_SIZE);
  return { students: rows, matching, page: given };
}

/** The angkatan of the students an account may see, the newest first. */
export async function listCohortYears(
  db: Database,
  limit: RowLimit,
): Promise<number[]> {
  const rows = await db
    .selectDistinct({ year: students.cohortYear })
    .from(students)
    .where(visibleTo(limit))
    .orderBy(desc(students.cohortYear));
  return rows.map((row) => row.year);
}
