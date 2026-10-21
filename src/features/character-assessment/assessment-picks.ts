import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { isUuid } from "@/db/is-uuid";
import { students, studyPrograms } from "@/db/schema";
import type { PenaltyKind } from "@/discipline-penalties/penalty-kinds";
import { readLimitsOf } from "@/discipline-penalties/read-limits";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { searchText } from "@/ui/search-text";
import { readLatestOf } from "./latest-assessments";

/** How many students one search offers. */
export const SEARCH_LIMIT = 10;

/** A student the form may pick, with the scores of their latest assessment. */
export interface AssessmentPick {
  id: string;
  name: string;
  nim: string;
  program: string;
  /** Null for a student never assessed. */
  latest: Scores | null;
  /** The penalty that holds their scores at 70, or null for none. */
  limit: PenaltyKind | null;
}

/**
 * The Aktif students the account may assess that `condition` lets
 * through, 10 at most, by name, with their latest scores and the penalty
 * that limits them, if any, read once for all of them. An account
 * without the right sees no student at all.
 */
async function readPicks(
  db: Database,
  actor: AccountForAccess,
  condition: SQL | undefined,
): Promise<AssessmentPick[]> {
  if (!may(actor.roles, "assess_character")) return [];
  const scope = visibleTo(rowLimitForAction(actor, "assess_character"));
  const found = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(ACTIVE_MEMBER, scope, condition))
    .orderBy(asc(students.name), asc(students.nim))
    .limit(SEARCH_LIMIT);
  const ids = found.map((student) => student.id);
  const [latest, limits] = await Promise.all([
    readLatestOf(db, ids),
    readLimitsOf(db, ids),
  ]);
  return found.map((student) => ({
    ...student,
    latest: latest.get(student.id)?.scores ?? null,
    limit: limits.get(student.id) ?? null,
  }));
}

/**
 * The Aktif students the account may assess whose name or NIM holds the
 * text, 10 at most, by name. An empty or too long text finds nobody, and
 * so does what is no text at all: `query` comes from outside.
 */
export async function searchAssessmentStudents(
  db: Database,
  actor: AccountForAccess,
  query: unknown,
): Promise<AssessmentPick[]> {
  const text = typeof query === "string" ? searchText(query) : null;
  if (text === null) return [];
  const pattern = containsPattern(text);
  return readPicks(
    db,
    actor,
    or(ilike(students.name, pattern), ilike(students.nim, pattern)),
  );
}

/**
 * The student an address asks the form to open with, picked, when the
 * account may assess them: Aktif and within its rows. Null for any
 * other, so the form opens with nobody picked.
 */
export async function readAssessmentPick(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<AssessmentPick | null> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return null;
  const [pick] = await readPicks(db, actor, eq(students.id, studentId));
  return pick ?? null;
}
