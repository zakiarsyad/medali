import { and, eq, isNull, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, mentorReplacements } from "@/db/schema";

/** A replacement that waits for its start date: Terjadwal. */
export const IS_WAITING = and(
  isNull(mentorReplacements.carriedOutAt),
  isNull(mentorReplacements.cancelledAt),
);

/**
 * Whether an account is named as the new mentor of a replacement that
 * waits for its start date. Such a mentor is kept for that group: no
 * other group may take them in the meantime.
 */
export const IS_PROMISED = sql<boolean>`exists (
  select 1 from ${mentorReplacements}
  where ${and(eq(mentorReplacements.newMentorId, accounts.id), IS_WAITING)}
)`;

/**
 * The same for one account, asked before its Pengasuh role is taken or
 * the account removed: the replacement could not be carried out then.
 */
export async function isKeptForReplacement(
  db: Database,
  accountId: string,
): Promise<boolean> {
  const [waiting] = await db
    .select({ id: mentorReplacements.id })
    .from(mentorReplacements)
    .where(and(eq(mentorReplacements.newMentorId, accountId), IS_WAITING))
    .limit(1);
  return waiting !== undefined;
}
