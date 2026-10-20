import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { isUuid } from "@/db/is-uuid";
import { healthNotes, students, studyPrograms } from "@/db/schema";
import { searchText } from "@/ui/search-text";
import { categoryOf } from "./fitness-category";
import type { FitnessCategory, FitnessLimits } from "./fitness-ids";
import type { HealthNote } from "./health-ids";
import { readNotes } from "./health-notes-read";
import { latestFitnessScores } from "./latest-fitness-scores";

/** How many students one search offers. */
export const SEARCH_LIMIT = 10;

/** A student the form may pick. */
export interface HealthPick {
  id: string;
  name: string;
  nim: string;
  program: string;
}

/** What the form shows of the student picked. */
export interface HealthSubject {
  /** The category of the latest fitness test, or null with none. */
  test: FitnessCategory | null;
  /** Every note of the student, newest first: the first is "Catatan terakhir". */
  notes: HealthNote[];
}

/**
 * The students `writable` lets through whose name or NIM holds the text,
 * 10 at most, by name. An empty or too long text finds nobody, and so
 * does what is no text at all: `query` comes from outside. The caller
 * decides who may write a note for whom.
 */
export async function searchNoteStudents(
  db: Database,
  writable: SQL | undefined,
  query: unknown,
): Promise<HealthPick[]> {
  const text = typeof query === "string" ? searchText(query) : null;
  if (text === null) return [];
  const pattern = containsPattern(text);
  return db
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
        writable,
        or(ilike(students.name, pattern), ilike(students.nim, pattern)),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(SEARCH_LIMIT);
}

/** The category of a student's latest fitness test, or null with none. */
export async function readTestCategory(
  db: Database,
  studentId: string,
  limits: FitnessLimits,
): Promise<FitnessCategory | null> {
  const latest = latestFitnessScores(db);
  const [found] = await db
    .select({ score: latest.score })
    .from(latest)
    .where(eq(latest.studentId, studentId));
  if (!found) return null;
  return categoryOf(found.score, limits);
}

/**
 * The test category and every note of a student `allowed` lets through,
 * or null for any other student. The caller decides who may read whose
 * notes.
 */
export async function readNoteSubject(
  db: Database,
  allowed: SQL | undefined,
  studentId: string,
  limits: FitnessLimits,
): Promise<HealthSubject | null> {
  if (!isUuid(studentId)) return null;
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), allowed));
  if (!found) return null;
  const [test, notes] = await Promise.all([
    readTestCategory(db, studentId, limits),
    readNotes(db, eq(healthNotes.studentId, studentId)),
  ]);
  return {
    test,
    notes: notes.map(({ studentId: _, ...note }) => note),
  };
}
