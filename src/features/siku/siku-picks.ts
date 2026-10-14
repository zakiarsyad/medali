import { and, asc, eq, gt, ilike, inArray, or, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { isUuid } from "@/db/is-uuid";
import {
  mentorGroupMembers,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import { MEMBERS } from "@/mentoring/member-count";
import { groupCode } from "@/ui/group-code";
import { searchText } from "@/ui/search-text";
import type { SikuTotals } from "./siku-score";
import { readTotalsOf } from "./siku-totals";

/** How many students one search offers. */
export const SEARCH_LIMIT = 10;

/** A student the form may pick, with what SIKU they hold now. */
export interface SikuPick extends SikuTotals {
  id: string;
  name: string;
  nim: string;
  program: string;
}

/** A kelompok pengasuhan the form offers, by its code. */
export interface GroupChoice {
  id: string;
  code: string;
  /** How many Aktif students it holds. */
  members: number;
}

async function picksWhere(
  db: Database,
  where: SQL | undefined,
  limit?: number,
): Promise<SikuPick[]> {
  const query = db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(ACTIVE_MEMBER, where))
    .orderBy(asc(students.name), asc(students.nim));
  const rows = limit === undefined ? await query : await query.limit(limit);
  const totals = await readTotalsOf(
    db,
    rows.map((row) => row.id),
  );
  return rows.map((row) => ({
    ...row,
    ...(totals.get(row.id) ?? { gains: 0, losses: 0 }),
  }));
}

/**
 * The Aktif students whose name or NIM holds the text, 10 at most, by
 * name. An empty or too long text finds nobody, and so does what is no
 * text at all: `query` comes from outside. Whether the account may ask
 * is checked by the caller.
 */
export async function searchSikuStudents(
  db: Database,
  query: unknown,
): Promise<SikuPick[]> {
  const text = typeof query === "string" ? searchText(query) : null;
  if (text === null) return [];
  const pattern = containsPattern(text);
  const found = or(ilike(students.name, pattern), ilike(students.nim, pattern));
  return picksWhere(db, found, SEARCH_LIMIT);
}

/**
 * The Aktif members of a group in force, by name, or nobody for what is
 * no such group. `groupId` comes from outside and is not trusted.
 */
export async function readGroupPicks(
  db: Database,
  groupId: unknown,
): Promise<SikuPick[]> {
  if (!isUuid(groupId)) return [];
  const [group] = await db
    .select({ id: mentorGroups.id })
    .from(mentorGroups)
    .where(and(eq(mentorGroups.id, String(groupId)), NOT_ENDED));
  if (!group) return [];
  const members = db
    .select({ id: mentorGroupMembers.studentId })
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.groupId, group.id));
  return picksWhere(db, inArray(students.id, members));
}

/** The groups in force that hold an Aktif student, newest angkatan first. */
export async function readGroupChoices(db: Database): Promise<GroupChoice[]> {
  const rows = await db
    .select({
      id: mentorGroups.id,
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
      members: MEMBERS,
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(and(NOT_ENDED, gt(MEMBERS, 0)))
    .orderBy(
      asc(studyPrograms.code),
      asc(mentorGroups.cohortYear),
      asc(mentorGroups.entryPath),
      asc(mentorGroups.number),
    );
  return rows.map((row) => ({
    id: row.id,
    code: groupCode(row),
    members: row.members,
  }));
}
