import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students } from "@/db/schema";
import type { GradeRow } from "@/features/character-grades/grade-list";
import { readGradeScheme } from "@/features/character-grades/grade-scheme";
import type { GradeScheme } from "@/features/character-grades/scheme-ids";
import { readGradeRows } from "./grade-rows";

/** "Nilai karakter (KEP-220)" of one student, for their detail. */
export interface StudentGrade {
  row: GradeRow;
  /** The scheme in force, which gives the weights and the pass letter. */
  scheme: GradeScheme;
}

/**
 * The grade now of one student, with its four parts. Null for an account
 * without the character panels, for a student outside its rows, and for
 * a student who is not Aktif, who has no grade: the same answer whether
 * or not there are parts to show, so a refusal tells nothing.
 */
export async function readStudentGrade(
  db: Database,
  account: AccountForAccess,
  studentId: string,
  today: string,
): Promise<StudentGrade | null> {
  if (!may(account.roles, "view_student_character_panels")) return null;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return null;
  const rows = rowLimitForAction(account, "view_student_character_panels");
  const asked = and(visibleTo(rows), eq(students.id, studentId));
  if (!asked) return null;
  const { scheme } = await readGradeScheme(db);
  const found = await readGradeRows(db, asked, scheme, today);
  const [row] = found.rows;
  if (!row) return null;
  return { row, scheme };
}
