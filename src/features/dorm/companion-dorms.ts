import { inArray, type SQL, sql } from "drizzle-orm";
import type { students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { dormInSql } from "@/dorms/resident-condition";

/** The dorms that have kakak pendamping. The two Wismantara dorms have none. */
export const COMPANION_DORM_IDS = [
  "dana_rakca",
  "cipta_bakti",
] as const satisfies readonly DormId[];

export type CompanionDormId = (typeof COMPANION_DORM_IDS)[number];

type Sex = (typeof students.$inferSelect)["sex"];

/** The dorm a student can be kakak pendamping of: women in Dana Rakca. */
export function companionDormOf(sex: Sex): CompanionDormId {
  return sex === "female" ? "dana_rakca" : "cipta_bakti";
}

export function hasCompanions(dorm: DormId): dorm is CompanionDormId {
  return COMPANION_DORM_IDS.some((id) => id === dorm);
}

/**
 * Whether a student row lives in a dorm that has kakak pendamping, worked
 * out by the database. Such a resident cannot be kakak pendamping. One who
 * lives in Wismantara, or in no dorm, can.
 */
export function livesWithCompanions(dormCohorts: number[]): SQL<boolean> {
  const livesThere = inArray(dormInSql(dormCohorts), [...COMPANION_DORM_IDS]);
  return sql<boolean>`coalesce(${livesThere}, false)`;
}
