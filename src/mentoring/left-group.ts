import { type AnyColumn, type SQL, sql } from "drizzle-orm";
import { accounts, mentorReplacements } from "@/db/schema";

/*
 * Each a part of its own: a read of accounts alone writes the columns
 * named directly in what it selects without their table, and "id" would
 * then be the id of the replacement, not of the account.
 */
const TOOK_A_GROUP_FROM = sql`${mentorReplacements.oldMentorId} = ${accounts.id}
  and ${mentorReplacements.carriedOutAt} is not null`;
const LATEST_FIRST = sql`${mentorReplacements.startsOn} desc,
  ${mentorReplacements.carriedOutAt} desc`;

/**
 * One value of the last replacement in force that took a group from an
 * account: the one with the latest start date. Null for an account no
 * replacement took a group from.
 */
function ofLastReplacement(column: AnyColumn): SQL {
  return sql`(
    select ${column} from ${mentorReplacements}
    where ${TOOK_A_GROUP_FROM}
    order by ${LATEST_FIRST}
    limit 1
  )`;
}

/**
 * Whether the last replacement that took a group from an account set the
 * mentor Tidak aktif. Such a mentor is Tidak aktif while they hold no
 * group, and is offered as a spare mentor nowhere.
 */
export const LEFT_AS_INACTIVE = sql<boolean>`coalesce(
  ${ofLastReplacement(mentorReplacements.oldMentorStatus)} = 'inactive',
  false
)`;

/** The start date of that replacement. Null when there is none. */
export const LEFT_ON = ofLastReplacement(mentorReplacements.startsOn).mapWith(
  mentorReplacements.startsOn,
);

/** The reason of that replacement. Null when there is none. */
export const LEFT_FOR = ofLastReplacement(mentorReplacements.reason).mapWith(
  mentorReplacements.reason,
);
