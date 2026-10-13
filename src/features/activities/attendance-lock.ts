import { sql } from "drizzle-orm";
import type { Database } from "@/db/connect";

/**
 * Makes a write of the attendance of one student for one schedule wait
 * until every other such write has ended. A student with nothing sent
 * has no row to hold, so a photo and a record made by hand at the same
 * moment would both find nothing and both be kept. The second now reads
 * what the first saved. Held to the end of the transaction `tx`.
 */
export async function waitForOtherAttendanceWrites(
  tx: Database,
  studentId: string,
  scheduleId: string,
): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${studentId}), hashtext(${scheduleId}))`,
  );
}
