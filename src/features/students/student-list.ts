import { and, asc, desc, eq, ne, type SQL } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students, studyPrograms } from "@/db/schema";
import type { CategoryField } from "./labels";
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

/** The students an account may see that match every filter. */
export function found(
  limit: RowLimit,
  filters: StudentListFilters,
): SQL | undefined {
  return and(
    visibleTo(limit),
    WITH_STATUS[filters.status],
    inCohort(filters.cohortYear),
    matchesSearch(filters.query),
    inProgram(filters.studyProgramId),
    byPath(filters.entryPath),
    inCategory(filters.category),
  );
}

/** The students an account may see that match the filters, by name. */
export async function listStudents(
  db: Database,
  limit: RowLimit,
  filters: StudentListFilters,
): Promise<{ students: ListedStudent[] }> {
  const rows = await db
    .select(ROW)
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(found(limit, filters))
    .orderBy(asc(students.name), asc(students.nim));
  return { students: rows };
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
