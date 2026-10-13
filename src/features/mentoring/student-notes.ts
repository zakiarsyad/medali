import { and, count, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { accounts, mentoringNotes, students } from "@/db/schema";
import { LISTED_NOTE, type ListedNote, NEWEST_FIRST } from "./note-list";

/** How many of a student's notes the detail shows: the newest ones. */
export const STUDENT_NOTES_SHOWN = 20;

export interface StudentNotes {
  /** The newest notes about the student, the one saved last first. */
  notes: ListedNote[];
  /** How many notes there are about the student in all. */
  count: number;
}

const NO_NOTES: StudentNotes = { notes: [], count: 0 };

/**
 * The notes about one student, for an account whose row limit for notes
 * holds the students in `visible`. A student outside it has no notes to
 * this account, as a student who does not exist has none.
 */
export async function listStudentNotes(
  db: Database,
  visible: SQL,
  studentId: string,
): Promise<StudentNotes> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return NO_NOTES;
  const ofStudent = and(eq(students.id, studentId), visible);
  const [counted] = await db
    .select({ notes: count() })
    .from(mentoringNotes)
    .innerJoin(students, eq(students.id, mentoringNotes.studentId))
    .where(ofStudent);
  if (!counted || counted.notes === 0) return NO_NOTES;
  const notes = await db
    .select(LISTED_NOTE)
    .from(mentoringNotes)
    .innerJoin(students, eq(students.id, mentoringNotes.studentId))
    .innerJoin(accounts, eq(accounts.id, mentoringNotes.writtenBy))
    .where(ofStudent)
    .orderBy(...NEWEST_FIRST)
    .limit(STUDENT_NOTES_SHOWN);
  return { notes, count: counted.notes };
}
