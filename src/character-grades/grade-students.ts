import { and, asc, eq, type SQL } from "drizzle-orm";
import {
  type AccountForAccess,
  may,
  rowLimitForAction,
  rowLimitForTab,
} from "@/auth/access";
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

/**
 * The students whose fixed grades of a closed semester an account sees,
 * whatever their status today, or null for an account without the right.
 * Only its roles with the right count: Ketua Program Studi sees the
 * students whose program today is theirs, Pengasuh their mentees today,
 * and a role that reads every student every one, also one who has left.
 */
export function fixedGradeVisibleTo(account: AccountForAccess): SQL | null {
  if (!may(account.roles, "view_fixed_grades")) return null;
  return visibleTo(rowLimitForAction(account, "view_fixed_grades"));
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
