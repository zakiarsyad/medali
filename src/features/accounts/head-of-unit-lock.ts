import { sql } from "drizzle-orm";
import type { Database } from "@/db/connect";

/**
 * The number every change of who is Kepala Unit waits on. Without it two
 * such changes at the same moment could each see the Kepala Unit of
 * before, and leave none or two.
 */
const HEAD_OF_UNIT_LOCK = 123_001;

/** Waits until no other change of who is Kepala Unit runs, until the transaction ends. */
export async function waitForHeadOfUnitChanges(tx: Database): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(${HEAD_OF_UNIT_LOCK})`);
}
