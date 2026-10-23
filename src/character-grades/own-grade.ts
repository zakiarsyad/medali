import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { readSkpmPointsOf } from "@/features/skpm/skpm-scores";
import { readGradeRowsIn } from "./grade-rows";
import { readGradeScheme } from "./grade-scheme";
import type { StudentGrade } from "./student-grade";

const RIGHT = "view_own_character_grade";

/**
 * "Nilai karakter (KEP-220)" of the student of an account, for Profil
 * saya, with their SKPM points by the uploads in force. No grade while no
 * semester runs, and for a student who is not Aktif.
 */
export type OwnGrade =
  | { grade: null }
  | { grade: StudentGrade; skpmPoints: number };

const NOT_YET: OwnGrade = { grade: null };

/**
 * The grade now of the student of the account, with its four parts, or
 * null for an account without the right. Which student is never asked
 * from outside: it is the one the account's own rows hold.
 */
export async function readOwnGrade(
  db: Database,
  account: AccountForAccess,
  today: string,
): Promise<OwnGrade | null> {
  if (!may(account.roles, RIGHT)) return null;
  const own = visibleTo(rowLimitForAction(account, RIGHT));
  const [{ scheme }, periods, points] = await Promise.all([
    readGradeScheme(db),
    readAcademicPeriods(db),
    readSkpmPointsOf(db, own),
  ]);
  const running = runningPeriodOn(periods, today);
  if (running === null) return NOT_YET;
  const { rows } = await readGradeRowsIn(db, own, scheme, running, today);
  const [row] = rows;
  // Rows that hold more than the account's own student, as a wider
  // role's would, are refused and not shown.
  if (!row || rows.length > 1) return NOT_YET;
  const skpmPoints = points.get(row.student.id) ?? 0;
  return { grade: { row, scheme }, skpmPoints };
}
