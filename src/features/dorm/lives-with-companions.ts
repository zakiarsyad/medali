import { inArray, type SQL, sql } from "drizzle-orm";
import { dormInSql } from "@/dorms/resident-condition";
import { COMPANION_DORM_IDS } from "./companion-dorms";

/**
 * Whether a student row lives in a dorm that has kakak pendamping, worked
 * out by the database. Such a resident cannot be kakak pendamping. One who
 * lives in Wismantara, or in no dorm, can.
 */
export function livesWithCompanions(dormCohorts: number[]): SQL<boolean> {
  const livesThere = inArray(dormInSql(dormCohorts), [...COMPANION_DORM_IDS]);
  return sql<boolean>`coalesce(${livesThere}, false)`;
}
