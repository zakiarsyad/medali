import { asc, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  violationNoteChanges,
  violationNotes,
} from "@/db/schema";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";

/** Made-up students, staff and notes for the checks of violation notes. */

/** An account with roles, of a study program when one is given. */
export async function addNoteActor(
  db: Database,
  name: string,
  roles: RoleId[],
  studyProgramId: number | null = null,
): Promise<AccountForAccess> {
  const [account] = await db
    .insert(accounts)
    .values({ name, studyProgramId })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles, studyProgramId, studentId: null };
}

/**
 * Students of a program of the file's own, named "<name> 1", "<name> 2"
 * and so on, one per NIM given.
 */
export async function addNoteStudents(
  db: Database,
  program: string,
  name: string,
  nims: string[],
): Promise<{ programId: number; studentIds: string[] }> {
  const programId = await addTestProgram(db, program);
  const studentIds: string[] = [];
  for (const [place, nim] of nims.entries()) {
    studentIds.push(
      await addTestStudent(db, programId, {
        nim,
        name: `${name} ${place + 1}`,
      }),
    );
  }
  return { programId, studentIds };
}

/** The Ganjil and Genap periods of a Tahun akademik. */
export async function addNotePeriods(db: Database, year: number) {
  await db.insert(academicPeriods).values([
    {
      startYear: year,
      term: "odd",
      startsOn: `${year}-08-01`,
      endsOn: `${year + 1}-01-31`,
    },
    {
      startYear: year,
      term: "even",
      startsOn: `${year + 1}-02-01`,
      endsOn: `${year + 1}-07-31`,
    },
  ]);
}

/**
 * A note of a student on a day, added straight to the table with its
 * log line, saved at 10:00 on campus that day and logged now. Gives
 * back its key.
 */
export async function addTestNote(
  db: Database,
  studentId: string,
  byId: string,
  day: string,
  more: Partial<typeof violationNotes.$inferInsert> = {},
): Promise<string> {
  const id = crypto.randomUUID();
  const savedAt = new Date(`${day}T10:00:00+07:00`);
  await db.insert(violationNotes).values({
    id,
    studentId,
    day,
    description: "Terlambat mengikuti apel pagi",
    punishment: "warning",
    savedBy: byId,
    savedAt,
    ...more,
  });
  await db.insert(violationNoteChanges).values({
    noteId: id,
    changedBy: byId,
    // Written now, as the log is: a later line of the note comes after it.
    changedAt: new Date(),
    action: "added",
  });
  return id;
}

/** The log lines of a note, the earliest first. */
export function linesOf(db: Database, noteId: string) {
  return db
    .select()
    .from(violationNoteChanges)
    .where(eq(violationNoteChanges.noteId, noteId))
    .orderBy(asc(violationNoteChanges.changedAt));
}

/** A note as it is kept. */
export async function noteAt(db: Database, noteId: string) {
  const [note] = await db
    .select()
    .from(violationNotes)
    .where(eq(violationNotes.id, noteId));
  return note;
}
