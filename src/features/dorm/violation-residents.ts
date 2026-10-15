import { and, asc, inArray, isNotNull, ne, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";
import { searchText } from "@/ui/search-text";
import { matchesSearch } from "./room-list";

/** How many residents one search of the form offers. */
export const PICKS_SHOWN = 10;

/** A resident the form may pick, with the dorm they live in. */
export interface ViolationPick {
  id: string;
  name: string;
  nim: string;
  dorm: DormId;
}

/** The dorm each student row lives in on a day, worked out by the database. */
async function dormOn(db: Database, day: string): Promise<SQL<DormId | null>> {
  return dormInSql((await readDormCohorts(db, day)) ?? []);
}

function notThemselves(ownStudentId: string | null): SQL | undefined {
  return ownStudentId === null ? undefined : ne(students.id, ownStudentId);
}

/**
 * The residents of any dorm on a day, today on campus, whose name or NIM
 * holds the text, 10 at most, by name. The student of the account that
 * searches is never among them. An empty or too long text finds nobody,
 * and so does what is no text at all: `query` comes from outside.
 */
export async function searchViolationStudents(
  db: Database,
  query: unknown,
  ownStudentId: string | null,
  day: string,
): Promise<ViolationPick[]> {
  const text = typeof query === "string" ? searchText(query) : null;
  if (text === null) return [];
  const dorm = await dormOn(db, day);
  const rows = await db
    .select({ id: students.id, name: students.name, nim: students.nim, dorm })
    .from(students)
    .where(
      and(isNotNull(dorm), matchesSearch(text), notThemselves(ownStudentId)),
    )
    .orderBy(asc(students.name), asc(students.nim))
    .limit(PICKS_SHOWN);
  const picks: ViolationPick[] = [];
  for (const row of rows) {
    if (row.dorm !== null) picks.push({ ...row, dorm: row.dorm });
  }
  return picks;
}

/**
 * The dorm each of these students lives in on a day. A student who lives
 * in none, is removed or is not found is left out.
 */
export async function readResidentDorms(
  db: Database,
  studentIds: readonly string[],
  day: string,
): Promise<Map<string, DormId>> {
  const found = new Map<string, DormId>();
  if (studentIds.length === 0) return found;
  const dorm = await dormOn(db, day);
  const rows = await db
    .select({ id: students.id, dorm })
    .from(students)
    .where(inArray(students.id, [...studentIds]));
  for (const row of rows) {
    if (row.dorm !== null) found.set(row.id, row.dorm);
  }
  return found;
}
