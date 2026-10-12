import { and, eq, isNull, type SQL, sql } from "drizzle-orm";
import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitFor,
} from "@/auth/access";
import {
  accountRoles,
  accounts,
  mentorGroupMentors,
  mentorGroups,
  roleChanges,
} from "@/db/schema";
import { groupsVisibleTo } from "./visible-groups";

/**
 * Which mentors an account may read, or null for an account without the
 * right to see mentors. Every read of mentors takes its limit from here,
 * so that a request made by hand reads none without the right.
 */
export function mentorRowsFor(account: AccountForAccess): RowLimit | null {
  if (!may(account.roles, "view_mentors")) return null;
  return rowLimitFor(account);
}

const HOLDS_ROLE_LINE = sql`exists (
  select 1 from ${accountRoles}
  where ${accountRoles.accountId} = ${accounts.id}
    and ${accountRoles.role} = 'mentor'
)`;

/** A line of the log of role changes that took the Pengasuh role away. */
const TOOK_MENTOR_ROLE = sql`${roleChanges.accountId} = ${accounts.id}
  and 'mentor' = any(${roleChanges.rolesBefore})
  and not ('mentor' = any(${roleChanges.rolesAfter}))`;

const LOST_ROLE = sql`exists (select 1 from ${roleChanges} where ${TOOK_MENTOR_ROLE})`;

const HELD_A_GROUP = sql`exists (
  select 1 from ${mentorGroupMentors}
  where ${mentorGroupMentors.mentorId} = ${accounts.id}
)`;

/**
 * A mentor: a staff account that has the Pengasuh role, or had it once. A
 * removed account keeps its role line, so that line alone does not say
 * the role is still held.
 */
const IS_MENTOR = sql`(
  ${accounts.studentId} is null
  and (${HOLDS_ROLE_LINE} or ${LOST_ROLE} or ${HELD_A_GROUP})
)`;

/** Whether an account has the Pengasuh role and is not removed. */
export const HAS_MENTOR_ROLE = sql<boolean>`(
  ${accounts.deletedAt} is null and ${HOLDS_ROLE_LINE}
)`;

/** When the Pengasuh role was last taken from an account. Null when never. */
export const ROLE_TAKEN_AT: SQL<Date | null> = sql`(
  select max(${roleChanges.changedAt}) from ${roleChanges}
  where ${TOOK_MENTOR_ROLE}
)`.mapWith(roleChanges.changedAt);

/** A mentor line of today, of a group an account with this limit may see. */
export function heldTodayBy(limit: RowLimit): SQL | undefined {
  return and(isNull(mentorGroupMentors.endsOn), groupsVisibleTo(limit));
}

/**
 * How many groups a mentor holds today, among those an account with this
 * limit may see.
 */
export function groupsHeldToday(limit: RowLimit): SQL<number> {
  return sql`(
    select count(*) from ${mentorGroupMentors}
    inner join ${mentorGroups}
      on ${mentorGroups.id} = ${mentorGroupMentors.groupId}
    where ${and(eq(mentorGroupMentors.mentorId, accounts.id), heldTodayBy(limit))}
  )`.mapWith(Number);
}

/**
 * The `where` of every read of mentors. An account that sees every row
 * sees every mentor. A limited one sees a mentor only while that mentor
 * holds today a group it may see: a mentor without one tells it nothing
 * of its own program.
 */
export function mentorsVisibleTo(limit: RowLimit): SQL {
  if (limit.kind === "all") return IS_MENTOR;
  return sql`(${IS_MENTOR} and ${groupsHeldToday(limit)} > 0)`;
}
