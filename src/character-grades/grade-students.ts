import { and, asc, eq, type SQL } from "drizzle-orm";
import { type AccountForAccess, rowLimitForTab } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students, studyPrograms } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { GradeStudent } from "./grade-list";

/**
 * The students whose grade an account sees: those its roles that open
 * Penilaian karakter see. Ketua Program Studi sees their own program,
 * Pengasuh their own mentees; a role without the tab adds nobody.
 */
export function gradeVisibleTo(account: AccountForAccess): SQL {
  return visibleTo(rowLimitForTab(account, "assessment", "character"));
}

/** The Aktif students among those `visible` lets through, by name. */
export function readGradeStudents(
  db: Database,
  visible: SQL,
): Promise<GradeStudent[]> {
  return db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(visible, ACTIVE_MEMBER))
    .orderBy(asc(students.name), asc(students.nim));
}
