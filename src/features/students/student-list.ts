import { asc, eq } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students, studyPrograms } from "@/db/schema";
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

/** The students an account may see, by name. */
export async function listStudents(
  db: Database,
  limit: RowLimit,
): Promise<{ students: ListedStudent[] }> {
  const rows = await db
    .select(ROW)
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(visibleTo(limit))
    .orderBy(asc(students.name), asc(students.nim));
  return { students: rows };
}
