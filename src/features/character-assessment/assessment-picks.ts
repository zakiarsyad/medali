import { and, asc, eq, ilike, or } from "drizzle-orm";
import { type AccountForAccess, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { students, studyPrograms } from "@/db/schema";
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
    .where(
      and(
        ACTIVE_MEMBER,
        scope,
        or(ilike(students.name, pattern), ilike(students.nim, pattern)),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(SEARCH_LIMIT);
  const latest = await readLatestOf(
    db,
    found.map((student) => student.id),
  );
  return found.map((student) => ({
    ...student,
    latest: latest.get(student.id)?.scores ?? null,
  }));
}
