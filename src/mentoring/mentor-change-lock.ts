import { sql } from "drizzle-orm";
import type { Database } from "@/db/connect";

/**
 * Makes a change that gives mentors their groups wait until every other
 * such change has ended: the penetapan of an angkatan and the replacement
 * of a mentor. Each holds only its own groups, so two at the same moment
 * would both read one spare mentor as free and both give them a group.
 * The second now reads what the first saved.
 */
export async function waitForOtherMentorChanges(tx: Database): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('mentor_group_changes'))`,
  );
}
