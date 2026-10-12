import { and, asc, count, desc, eq, ne, type SQL } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students, studyPrograms } from "@/db/schema";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import type { CategoryField } from "./labels";
import type { StageCohorts } from "./stage-cohorts";
import { fromAgency, fromProvince, inStage } from "./stage-origin-conditions";
import { matchesSearch } from "./student-conditions";
import type {
  EntryPath,
  StatusChoice,
  StudentListFilters,
} from "./student-list-address";
import { visibleTo } from "./visible-students";

type Student = typeof students.$inferSelect;

/** One row of the Mahasiswa table. */
export interface ListedStudent {
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
}

const ROW = {
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
};

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
 * The students an account may see that match every filter. The Tahapan
 * filter reads which angkatan is in which tahap now from `cohorts`.
 */
export function found(
  limit: RowLimit,
  filters: StudentListFilters,
  cohorts: StageCohorts,
): SQL | undefined {
  return and(
    visibleTo(limit),
    WITH_STATUS[filters.status],
    inCohort(filters.cohortYear),
    matchesSearch(filters.query),
    inProgram(filters.studyProgramId),
    byPath(filters.entryPath),
    inCategory(filters.category),
    inStage(filters.stageNo, cohorts),
    fromProvince(filters.province),
    fromAgency(filters.originAgency),
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
 * name.
 */
export async function listStudents(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
  page: number,
  cohorts: StageCohorts,
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
    .select(ROW)
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
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
