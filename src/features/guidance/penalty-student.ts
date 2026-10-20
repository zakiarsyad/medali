import { and, asc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { isUuid } from "@/db/is-uuid";
import { students, studyPrograms } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { searchText } from "@/ui/search-text";
import { SEARCH_LIMIT } from "./note-student";

/** A student the form of a penalty may pick. */
export interface PenaltyPick {
  id: string;
  name: string;
  nim: string;
  program: string;
  /** Whether the student has an Instansi asal, where kerja sosial may then be done. */
  hasAgency: boolean;
  /** Angkatan, for the semester of a suspension. */
  cohortYear: number;
}

/**
 * The students an account may record a penalty for: the Aktif students
 * its roles with the right to record see. Nobody for an account without
 * it.
 */
export function recordableFor(actor: AccountForAccess): SQL | undefined {
  if (!may(actor.roles, "record_discipline_penalties")) return sql`false`;
  return and(
    ACTIVE_MEMBER,
    visibleTo(rowLimitForAction(actor, "record_discipline_penalties")),
  );
}

const HAS_AGENCY = sql<boolean>`coalesce(btrim(${students.originAgency}), '') <> ''`;

function picks(db: Database) {
  return db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      hasAgency: HAS_AGENCY.mapWith(Boolean),
      cohortYear: students.cohortYear,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId));
}

/**
 * The students the account may record a penalty for whose name or NIM
 * holds the text, 10 at most, by name. An empty or too long text finds
 * nobody, and so does what is no text at all: `query` comes from
 * outside.
 */
export async function searchPenaltyStudents(
  db: Database,
  actor: AccountForAccess,
  query: unknown,
): Promise<PenaltyPick[]> {
  const text = typeof query === "string" ? searchText(query) : null;
  if (text === null) return [];
  const pattern = containsPattern(text);
  return picks(db)
    .where(
      and(
        recordableFor(actor),
        or(ilike(students.name, pattern), ilike(students.nim, pattern)),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(SEARCH_LIMIT);
}

/** A student the account may record a penalty for, or null. */
export async function readPenaltyPick(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
): Promise<PenaltyPick | null> {
  if (!isUuid(studentId)) return null;
  const [found] = await picks(db).where(
    and(eq(students.id, studentId), recordableFor(actor)),
  );
  return found ?? null;
}
