import { asc, eq, sql } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { studentSemester } from "@/academic-periods/student-semester";
import type { Scores } from "@/character-scores/assessment-score";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { opensDetailOf } from "@/mentoring/opens-detail";
import type { MenteeMember } from "./mentee-recap";
import type { MenteeScope } from "./mentee-scope";

type Found = Awaited<ReturnType<typeof readRows>>[number];

/**
 * The anak asuh with their latest scores as shown, held at 70 where a
 * penalty limits them, the lowest Rerata first and those not assessed
 * last. A group is small, so all of them are read at once.
 */
function readRows(db: Database, scope: MenteeScope) {
  const latest = latestAssessments(db);
  return db
    .select({
      studentId: students.id,
      name: students.name,
      nim: students.nim,
      className: students.className,
      cohortYear: students.cohortYear,
      opensDetail: opensDetailOf(scope.detail),
      total: latest.total,
      M: latest.scoreM,
      E: latest.scoreE,
      D: latest.scoreD,
      A: latest.scoreA,
      L: latest.scoreL,
      I: latest.scoreI,
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(scope.mentees)
    .orderBy(
      sql`${latest.total} asc nulls last`,
      asc(students.name),
      asc(students.nim),
    );
}

function scoresOf(row: Found): Scores | null {
  const { M, E, D, A, L, I } = row;
  if (M === null || E === null || D === null) return null;
  if (A === null || L === null || I === null) return null;
  return { M, E, D, A, L, I };
}

/**
 * "Anak asuh" of Dashboard anak asuh: every Aktif anak asuh, each with
 * the semester of the running period, or none while no period runs.
 */
export async function readMenteeTable(
  db: Database,
  scope: MenteeScope,
  period: AcademicPeriod | null,
): Promise<MenteeMember[]> {
  const rows = await readRows(db, scope);
  return rows.map((row) => ({
    studentId: row.studentId,
    name: row.name,
    nim: row.nim,
    className: row.className,
    semester: period === null ? null : studentSemester(row.cohortYear, period),
    scores: scoresOf(row),
    opensDetail: row.opensDetail,
  }));
}
