import type { Database } from "@/db/connect";
import { readDormCohorts } from "@/dorms/dorm-cohorts";

/**
 * The angkatan years that live in the dorm today, for a read of many
 * students. None while no academic period runs: no semester is known
 * then, so only Internasional and Pembibitan students are residents.
 */
export async function dormCohortsNow(db: Database): Promise<number[]> {
  return (await readDormCohorts(db)) ?? [];
}
