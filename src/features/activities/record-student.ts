import { and, asc, eq, ilike, or } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { isUuid } from "@/db/is-uuid";
import { students, studyPrograms } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { searchText } from "@/ui/search-text";
import type { RecordStudent } from "./manual-record";
import { mayVerify } from "./may-verify";

/** How many students one search offers. */
export const RECORD_SEARCH_LIMIT = 10;

/**
 * The Aktif students whose name or NIM holds the text, by name, 10 at
 * most, for an account that may verify attendance. Anyone else is
 * offered nobody, and so is an empty or too long text, or what is no
 * text at all: `query` comes from outside.
 */
export async function searchRecordStudents(
  db: Database,
  account: AccountForAccess,
  query: unknown,
): Promise<RecordStudent[]> {
  if (!mayVerify(account)) return [];
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
        ACTIVE_MEMBER,
        or(ilike(students.name, pattern), ilike(students.nim, pattern)),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(RECORD_SEARCH_LIMIT);
}

/** An Aktif student, with what tells which schedules are meant for them. */
export interface ActiveStudent {
  id: string;
  name: string;
  cohortYear: number;
}

/**
 * One Aktif student, or null when there is none with that key. Whether
 * the account may ask is checked by the caller. `id` comes from outside
 * and is not trusted.
 */
export async function readActiveStudent(
  db: Database,
  id: unknown,
): Promise<ActiveStudent | null> {
  if (typeof id !== "string" || !isUuid(id)) return null;
  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      cohortYear: students.cohortYear,
    })
    .from(students)
    .where(and(eq(students.id, id), ACTIVE_MEMBER));
  return student ?? null;
}
