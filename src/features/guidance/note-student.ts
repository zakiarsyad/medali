import { and, asc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { isUuid } from "@/db/is-uuid";
import { students, studyPrograms } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { searchText } from "@/ui/search-text";
import { countPenaltiesOf } from "./penalty-history";
import { type ActiveNote, readActiveNotesOf } from "./placed-notes";

/** How many students one search offers. */
export const SEARCH_LIMIT = 10;

/** A student the form may pick. */
export interface NotePick {
  id: string;
  name: string;
  nim: string;
  program: string;
}

/**
 * The students an account may write a note for: the Aktif students its
 * roles with the right to write see. Nobody for an account without it.
 */
export function writableFor(actor: AccountForAccess): SQL | undefined {
  if (!may(actor.roles, "write_violation_notes")) return sql`false`;
  return and(
    ACTIVE_MEMBER,
    visibleTo(rowLimitForAction(actor, "write_violation_notes")),
  );
}

/**
 * The students the account may write a note for whose name or NIM holds
 * the text, 10 at most, by name. An empty or too long text finds nobody,
 * and so does what is no text at all: `query` comes from outside.
 */
export async function searchNoteStudents(
  db: Database,
  actor: AccountForAccess,
  query: unknown,
): Promise<NotePick[]> {
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
        writableFor(actor),
        or(ilike(students.name, pattern), ilike(students.nim, pattern)),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(SEARCH_LIMIT);
}

/** The name of a student the account may write a note for, or null. */
export async function writableName(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<string | null> {
  if (!isUuid(studentId)) return null;
  const [found] = await db
    .select({ name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), writableFor(actor)));
  return found?.name ?? null;
}

/** What the box of the student picked shows. */
export interface StudentBox {
  /** Their notes of the running semester that are not removed, the earliest first. */
  notes: ActiveNote[];
  /** How many discipline penalties they have; 0 for an account that may not read them. */
  penalties: number;
}

async function penaltiesOf(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<number> {
  if (!may(actor.roles, "view_discipline_records")) return 0;
  return countPenaltiesOf(db, studentId);
}

/**
 * The box of the student picked: their notes of the running semester on
 * `today` that are not removed, and how many discipline penalties they
 * have. Null for a student the account may not write a note for.
 */
export async function readStudentBox(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  today: string,
): Promise<StudentBox | null> {
  if ((await writableName(db, actor, studentId)) === null) return null;
  const period = await readRunningPeriod(db, today);
  return {
    notes: await readActiveNotesOf(db, studentId, period),
    penalties: await penaltiesOf(db, actor, studentId),
  };
}
