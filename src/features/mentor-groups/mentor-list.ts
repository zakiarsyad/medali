import { and, asc, count, eq, ilike, type SQL, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { accounts } from "@/db/schema";
import { pageWithin } from "@/ui/list-pages";
import {
  type HeldGroup,
  readGroupsHeld,
  studentsIn,
} from "./mentor-held-groups";
import type { MentorListFilters } from "./mentor-list-address";
import {
  inactiveSince,
  MENTOR_STATUSES,
  type MentorStatus,
} from "./mentor-status";
import {
  groupsHeldToday,
  HAS_MENTOR_ROLE,
  mentorsVisibleTo,
  ROLE_TAKEN_AT,
} from "./visible-mentors";

/** How many mentors one page of the list shows. */
export const MENTOR_PAGE_SIZE = 50;

/** One row of the Pengasuh list. The NIP of the mentor is never read. */
export interface ListedMentor {
  id: string;
  name: string;
  title: string | null;
  unit: string | null;
  status: MentorStatus;
  /** The day since when a Tidak aktif mentor is so, when it is known. */
  inactiveSince: string | null;
  /** The groups held today, among those the account may see. */
  groups: HeldGroup[];
  /** How many Aktif students those groups hold. */
  students: number;
}

/**
 * The status of a mentor as `mentorStatus` works it out, for the database
 * to filter and sort by. A check keeps the two the same.
 */
export function shownStatus(limit: RowLimit): SQL<MentorStatus> {
  return sql<MentorStatus>`(
    case
      when ${groupsHeldToday(limit)} > 0 then 'mentoring'
      when ${HAS_MENTOR_ROLE} then 'reserve'
      else 'inactive'
    end
  )`;
}

/** The place of a status in the list: the order of `MENTOR_STATUSES`. */
function statusPlace(status: SQL<MentorStatus>): SQL {
  const inOrder = sql.join(
    MENTOR_STATUSES.map((one) => sql`${one}`),
    sql`, `,
  );
  return sql`array_position(array[${inOrder}]::text[], ${status})`;
}

function matchesSearch(query: string): SQL | undefined {
  if (query === "") return undefined;
  return ilike(accounts.name, containsPattern(query));
}

function hasStatus(
  shown: SQL<MentorStatus>,
  status: MentorStatus | null,
): SQL | undefined {
  return status === null ? undefined : sql`${shown} = ${status}`;
}

function inUnit(unit: string | null): SQL | undefined {
  return unit === null ? undefined : eq(accounts.unit, unit);
}

async function countMentors(
  db: Database,
  condition: SQL | undefined,
): Promise<number> {
  const [counted] = await db
    .select({ matching: count() })
    .from(accounts)
    .where(condition);
  return counted?.matching ?? 0;
}

function readRows(
  db: Database,
  shown: SQL<MentorStatus>,
  condition: SQL | undefined,
  page: number,
) {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      title: accounts.title,
      unit: accounts.unit,
      status: shown,
      deletedAt: accounts.deletedAt,
      roleTakenAt: ROLE_TAKEN_AT,
    })
    .from(accounts)
    .where(condition)
    .orderBy(statusPlace(shown), asc(accounts.name), asc(accounts.id))
    .limit(MENTOR_PAGE_SIZE)
    .offset((page - 1) * MENTOR_PAGE_SIZE);
}

type MentorRow = Awaited<ReturnType<typeof readRows>>[number];

function listed(row: MentorRow, held: HeldGroup[]): ListedMentor {
  const { deletedAt, roleTakenAt, ...mentor } = row;
  const groups = held.filter((group) => group.mentorId === row.id);
  const isInactive = row.status === "inactive";
  return {
    ...mentor,
    inactiveSince: isInactive
      ? inactiveSince({ roleTakenAt, deletedAt })
      : null,
    groups,
    students: studentsIn(groups),
  };
}

export interface MentorPage {
  mentors: ListedMentor[];
  /** How many mentors match in all, on every page. */
  matching: number;
  /** The page given: the one asked for, or the last when it is past it. */
  page: number;
}

/**
 * One page of the mentors an account may see that match the filters:
 * Mengasuh first, then Cadangan, then Tidak aktif, each by name. The
 * groups of the whole page come in one read, not one per mentor.
 */
export async function listMentors(
  db: Database,
  limit: RowLimit,
  filters: MentorListFilters,
  page: number,
): Promise<MentorPage> {
  const shown = shownStatus(limit);
  const condition = and(
    mentorsVisibleTo(limit),
    matchesSearch(filters.query),
    hasStatus(shown, filters.status),
    inUnit(filters.unit),
  );
  const matching = await countMentors(db, condition);
  const given = pageWithin(page, matching, MENTOR_PAGE_SIZE);
  if (matching === 0) return { mentors: [], matching, page: given };
  const rows = await readRows(db, shown, condition, given);
  const held = await readGroupsHeld(
    db,
    limit,
    rows.map((row) => row.id),
  );
  const mentors = rows.map((row) => listed(row, held));
  return { mentors, matching, page: given };
}
