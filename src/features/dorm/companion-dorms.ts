import type { students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";

/** The dorms that have kakak pendamping. The two Wismantara dorms have none. */
export const COMPANION_DORM_IDS = [
  "dana_rakca",
  "cipta_bakti",
] as const satisfies readonly DormId[];

export type CompanionDormId = (typeof COMPANION_DORM_IDS)[number];

type Sex = (typeof students.$inferSelect)["sex"];

/** The dorm a student can be kakak pendamping of: men in Dana Rakca. */
export function companionDormOf(sex: Sex): CompanionDormId {
  return sex === "male" ? "dana_rakca" : "cipta_bakti";
}

export function hasCompanions(dorm: DormId): dorm is CompanionDormId {
  return COMPANION_DORM_IDS.some((id) => id === dorm);
}
