import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";
import type { GroupCodeParts } from "@/ui/group-code";
import { PAGE_SIZE, pageWithin } from "@/ui/list-pages";
import type { GroupListFilters } from "./group-list-address";
import { COUNTED_MEMBER } from "./member-conditions";
import { groupsVisibleTo } from "./visible-groups";

/** One row of the Kelompok pengasuhan list. */
export interface ListedGroup extends GroupCodeParts {
  id: string;
  studyProgram: string;
  /** The mentor of today. Null for a group that has none. */
  mentorName: string | null;
  /** The day the mentor of today took the group. */
  mentorSince: string | null;
  /** How many Aktif students the group holds. */
  members: number;
  /** How many mentor lines the group has had, the one of today included. */
  mentorLines: number;
}

/** The mentor line of today, named apart from the lines that are counted. */
const mentorToday = alias(mentorGroupMentors, "mentor_today");

const MEMBERS = sql`(
  select count(*) from ${mentorGroupMembers}
  inner join ${students} on ${students.id} = ${mentorGroupMembers.studentId}
  where ${mentorGroupMembers.groupId} = ${mentorGroups.id}
    and ${COUNTED_MEMBER}
)`.mapWith(Number);

const MENTOR_LINES = sql`(
  select count(*) from ${mentorGroupMentors}
  where ${mentorGroupMentors.groupId} = ${mentorGroups.id}
)`.mapWith(Number);

const ROW = {
  id: mentorGroups.id,
  cohortYear: mentorGroups.cohortYear,
  entryPath: mentorGroups.entryPath,
  number: mentorGroups.number,
  programCode: studyPrograms.code,
  studyProgram: studyPrograms.name,
  mentorName: accounts.name,
  mentorSince: mentorToday.startsOn,
  members: MEMBERS,
  mentorLines: MENTOR_LINES,
};

/**
 * The code of a group as `groupCode` writes it, for the database to
 * search in. A check keeps the two the same.
 */
const SHOWN_CODE = sql`(
  'KP ' || right(${mentorGroups.cohortYear}::text, 2) || '-'
  || ${studyPrograms.code}
  || case when ${mentorGroups.entryPath} = 'transfer' then '-AJ-' else '-' end
  || case when ${mentorGroups.number} < 10 then '0' else '' end
  || ${mentorGroups.number}::text
)`;

/** Groups whose code or mentor of today holds the text. */
function matchesSearch(query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(SHOWN_CODE, pattern), ilike(accounts.name, pattern));
}

function inProgram(id: number | null): SQL | undefined {
  return id === null ? undefined : eq(mentorGroups.studyProgramId, id);
}

function inCohort(year: number | null): SQL | undefined {
  return year === null ? undefined : eq(mentorGroups.cohortYear, year);
}

/** The groups an account may see that match every filter. */
function found(limit: RowLimit, filters: GroupListFilters): SQL | undefined {
  return and(
    groupsVisibleTo(limit),
    matchesSearch(filters.query),
    inProgram(filters.studyProgramId),
    inCohort(filters.cohortYear),
  );
}

const HELD_TODAY = and(
  eq(mentorToday.groupId, mentorGroups.id),
  isNull(mentorToday.endsOn),
);

/** The search reads the program studi and the mentor, so both are joined. */
async function countGroups(
  db: Database,
  condition: SQL | undefined,
): Promise<number> {
  const [counted] = await db
    .select({ matching: count() })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(mentorToday, HELD_TODAY)
    .leftJoin(accounts, eq(accounts.id, mentorToday.mentorId))
    .where(condition);
  return counted?.matching ?? 0;
}

function readRows(db: Database, condition: SQL | undefined, page: number) {
  return db
    .select(ROW)
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(mentorToday, HELD_TODAY)
    .leftJoin(accounts, eq(accounts.id, mentorToday.mentorId))
    .where(condition)
    .orderBy(
      desc(mentorGroups.cohortYear),
      asc(studyPrograms.name),
      asc(mentorGroups.entryPath),
      asc(mentorGroups.number),
    )
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
}

export interface GroupPage {
  groups: ListedGroup[];
  /** How many groups match in all, on every page. */
  matching: number;
  /** The page given: the one asked for, or the last when it is past it. */
  page: number;
}

/**
 * One page of the groups an account may see that match the filters: the
 * newest angkatan first, then by program studi and number.
 */
export async function listGroups(
  db: Database,
  limit: RowLimit,
  filters: GroupListFilters,
  page: number,
): Promise<GroupPage> {
  const condition = found(limit, filters);
  const matching = await countGroups(db, condition);
  const given = pageWithin(page, matching);
  if (matching === 0) return { groups: [], matching, page: given };
  const groups = await readRows(db, condition, given);
  return { groups, matching, page: given };
}
