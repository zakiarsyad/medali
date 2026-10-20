import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import type { Action } from "@/auth/roles";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { isUuid } from "@/db/is-uuid";
import { students, studyPrograms } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { searchText } from "@/ui/search-text";
import { readConsentOf } from "./consent-reads";
import type { ConsentView } from "./consent-view";
import { STUDENT_NOT_FOUND } from "./consent-words";

/** How many students one search offers. */
export const SEARCH_LIMIT = 20;

/** A student Konselor may pick on "Persetujuan konseling". */
export interface ConsentPick {
  id: string;
  name: string;
  nim: string;
  program: string;
}

/**
 * The students Konselor may pick: every student that is not removed,
 * whatever their status, as Konselor helps any student.
 */
function pickable(
  actor: AccountForAccess,
  action: Action = "manage_counselling_consent",
): SQL {
  return visibleTo(rowLimitForAction(actor, action));
}

/**
 * The students whose name or NIM holds the text, 20 at most, by name.
 * Nothing for an account without the right, and for an empty or too
 * long text, or what is no text at all: `query` comes from outside.
 */
export async function searchConsentStudents(
  db: Database,
  actor: AccountForAccess,
  query: unknown,
): Promise<ConsentPick[]> {
  return searchStudentsFor(db, actor, "manage_counselling_consent", query);
}

/**
 * The students an account with the right `action` may pick, whose name
 * or NIM holds the text, 20 at most, by name. Nothing for an account
 * without the right, and for an empty, too long or missing text.
 */
export async function searchStudentsFor(
  db: Database,
  actor: AccountForAccess,
  action: Action,
  query: unknown,
): Promise<ConsentPick[]> {
  if (!may(actor.roles, action)) return [];
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
        pickable(actor, action),
        or(ilike(students.name, pattern), ilike(students.nim, pattern)),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(SEARCH_LIMIT);
}

/** The name of a student Konselor may pick, or null for any other id. */
export async function pickableStudentName(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
): Promise<string | null> {
  if (typeof studentId !== "string" || !isUuid(studentId)) return null;
  const [found] = await db
    .select({ name: students.name })
    .from(students)
    .where(and(eq(students.id, studentId), pickable(actor)));
  return found?.name ?? null;
}

/**
 * The current consent of a picked student, or null when they were never
 * asked. Refused for a student Konselor may not pick; an account without
 * the right finds no student.
 */
export async function lookUpConsent(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
): Promise<Parsed<ConsentView | null>> {
  if (!may(actor.roles, "manage_counselling_consent")) {
    return { ok: false, error: STUDENT_NOT_FOUND };
  }
  const name = await pickableStudentName(db, actor, studentId);
  if (name === null || typeof studentId !== "string") {
    return { ok: false, error: STUDENT_NOT_FOUND };
  }
  return { ok: true, value: await readConsentOf(db, studentId) };
}
