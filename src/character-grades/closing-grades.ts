import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { NOT_REMOVED } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import type { GradeRow } from "./grade-list";
import { readGradeRowsIn } from "./grade-rows";
import { readGradeScheme } from "./grade-scheme";
import type { GradeScheme } from "./scheme-ids";

/** What closing a period would keep now: the scheme in force and each grade. */
export interface ClosingGrades {
  scheme: GradeScheme;
  rows: GradeRow[];
}

/**
 * The grade of every Aktif student of the campus by the scheme in force,
 * with Kehadiran and Pengasuhan of `period` as they stand on `today`, and
 * SIKU and SKPM as they stand now: what a closing of the period fixes.
 */
export async function readClosingGrades(
  db: Database,
  period: AcademicPeriod,
  today: string,
): Promise<ClosingGrades> {
  const { scheme } = await readGradeScheme(db);
  const { rows } = await readGradeRowsIn(
    db,
    NOT_REMOVED,
    scheme,
    period,
    today,
  );
  return { scheme, rows };
}
