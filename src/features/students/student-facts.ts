import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students, studyPrograms } from "@/db/schema";

type Student = typeof students.$inferSelect;

/** What the student detail and Profil saya both show of one student. */
export interface StudentFacts {
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
}

const FACTS = {
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

/** The read of those facts, for the caller to say which students. */
export function selectStudentFacts(db: Database) {
  return db
    .select(FACTS)
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId));
}
