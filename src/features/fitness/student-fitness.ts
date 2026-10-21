import { and, eq, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students, studyPrograms } from "@/db/schema";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { latestFitnessScores } from "@/health-notes/latest-fitness-scores";
import { latestHealthNotes } from "@/health-notes/latest-health-notes";
import {
  type FitnessListRow,
  listRow,
  type ReadRow,
  readableNotes,
} from "./fitness-board";

/**
 * "Kesehatan jasmani" of one student, for their detail. `health` is null,
 * and the final category bears no mark of a note, for an account that
 * may not read the student's note.
 */
export type StudentFitness = Pick<
  FitnessListRow,
  "latest" | "final" | "health"
>;

async function readFitnessRow(
  db: Database,
  account: AccountForAccess,
  studentId: string,
): Promise<ReadRow | null> {
  const visible = visibleTo(
    rowLimitForAction(account, "view_student_fitness_panel"),
  );
  const readable = visibleTo(
    rowLimitForAction(account, "view_student_fitness_notes"),
  );
  const latest = latestFitnessScores(db);
  const note = latestHealthNotes(db);
  const [found] = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      score: latest.score,
      testedOn: latest.testedOn,
      noteId: note.noteId,
      noteCategory: note.category,
      readsNote: sql<boolean>`coalesce(${readable}, false)`,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(note, eq(note.studentId, students.id))
    .where(and(eq(students.id, studentId), visible));
  return found ?? null;
}

/**
 * The latest fitness score of one student, the day of its test and
 * their final category; their latest note only where the account reads
 * it, so no note of anyone else leaves the database. Null for an account
 * without the panel and for a student outside its rows: the same answer
 * whether or not the student was tested, so a refusal tells nothing.
 */
export async function readStudentFitness(
  db: Database,
  account: AccountForAccess,
  studentId: string,
): Promise<StudentFitness | null> {
  if (!may(account.roles, "view_student_fitness_panel")) return null;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return null;
  const row = await readFitnessRow(db, account, studentId);
  if (!row) return null;
  const [{ limits }, notes] = await Promise.all([
    readFitnessLimits(db),
    readableNotes(db, [row]),
  ]);
  const { latest, final, health } = listRow(row, limits, notes);
  return { latest, final, health };
}
