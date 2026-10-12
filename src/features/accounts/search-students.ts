import { and, asc, eq, ilike, isNull, not, or } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { accounts, students, studyPrograms } from "@/db/schema";
import { holdsBamRole } from "./list-bam-students";
import type { Manager } from "./save-bam-roles";
import { searchText } from "./search-text";

export const SEARCH_LIMIT = 10;

/** A student who may be given a BAM role. */
export interface FoundStudent {
  accountId: string;
  name: string;
  nim: string;
  studyProgram: string;
}

/**
 * The Aktif students whose name or NIM holds the text, by name, 10 at
 * most. A student who already holds a BAM role is left out: their roles
 * are changed in the list. An empty or too long text offers nobody, and
 * so does a search by a role without the right: the screen refuses that
 * role before it gets here, so only a hand-made request is answered so.
 */
export async function searchActiveStudents(
  db: Database,
  manager: Manager,
  query: string,
): Promise<FoundStudent[]> {
  if (!may(manager.roles, "manage_users")) return [];
  const text = searchText(query);
  if (text === null) return [];
  const pattern = containsPattern(text);
  return db
    .select({
      accountId: accounts.id,
      name: students.name,
      nim: students.nim,
      studyProgram: studyPrograms.name,
    })
    .from(accounts)
    .innerJoin(students, eq(students.id, accounts.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(
      and(
        isNull(accounts.deletedAt),
        isNull(students.deletedAt),
        eq(students.status, "active"),
        not(holdsBamRole(db)),
        or(ilike(students.name, pattern), ilike(students.nim, pattern)),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(SEARCH_LIMIT);
}
