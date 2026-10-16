import { and, asc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { isUuid } from "@/db/is-uuid";
import { healthNotes, students, studyPrograms } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { dormInSql } from "@/dorms/resident-condition";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
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
 * Whether roles write health notes on Penilaian jasmani: they enter
 * fitness scores and read health notes, as Kepala Unit and Penilai
 * Mahasiswa do.
 */
export function mayWriteNotes(roles: readonly RoleId[]): boolean {
  return may(roles, "enter_fitness_scores") && may(roles, "view_health_notes");
}

/**
 * The students an account may write a note for on Penilaian jasmani:
 * Aktif ones its roles with the right "Penilaian jasmani" see, who live
 * in no dorm. The angkatan years given are those in a semester that
 * lives in the dorm. Dorm residents' notes are written on Asrama.
 */
export function writableFor(
  actor: AccountForAccess,
  dormCohorts: number[],
): SQL | undefined {
  return and(
    ACTIVE_MEMBER,
    visibleTo(rowLimitForAction(actor, "enter_fitness_scores")),
    sql`${dormInSql(dormCohorts)} is null`,
  );
}

/** The angkatan years in the dorm on a day, none while no period runs. */
export async function dormCohortsOn(
  db: Database,
  day: string,
): Promise<number[]> {
  return (await readDormCohorts(db, day)) ?? [];
}

/**
 * The students the account may write a note for whose name or NIM holds
 * the text, 10 at most, by name. An empty or too long text finds nobody,
 * and so does what is no text at all: `query` comes from outside.
 */
export async function searchHealthStudents(
  db: Database,
  actor: AccountForAccess,
  query: unknown,
  day: string,
): Promise<HealthPick[]> {
  const text = typeof query === "string" ? searchText(query) : null;
  if (text === null) return [];
  const pattern = containsPattern(text);
  const writable = writableFor(actor, await dormCohortsOn(db, day));
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
 * The test category and every note of a student the account may write a
 * note for and read the notes of, or null for any other student.
 */
export async function readHealthSubject(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  limits: FitnessLimits,
  day: string,
): Promise<HealthSubject | null> {
  if (!may(actor.roles, "view_health_notes")) return null;
  if (!isUuid(studentId)) return null;
  const readable = visibleTo(rowLimitForAction(actor, "view_health_notes"));
  const writable = writableFor(actor, await dormCohortsOn(db, day));
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), writable, readable));
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
