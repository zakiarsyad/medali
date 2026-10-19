import type { students } from "@/db/schema";
import type { DormId } from "./dorms";

/** What the rule needs to know of a student. */
export type ResidentFacts = Pick<
  typeof students.$inferSelect,
  "status" | "entryPath" | "sex" | "isInternational" | "isSeedling"
>;

/**
 * Where Pengelola Asrama decided by hand that a student lives: in `dorm`,
 * or in none ("Non asrama") when it is null.
 */
export interface ChosenDorm {
  dorm: DormId | null;
}

const LAST_DORM_SEMESTER = 2;

/**
 * Whether a semester is one a Reguler student spends in the dorm. A
 * semester is not known when no academic period runs.
 */
export function isDormSemester(semester: number | null): boolean {
  return semester !== null && semester <= LAST_DORM_SEMESTER;
}

/**
 * The dorm a student lives in, or null for a student who does not live in
 * one. Only an active student is a resident: an active kakak pendamping
 * in the dorm they serve, and no other; else where a choice made by hand
 * puts them; else Internasional and Pembibitan in any semester, in
 * Wismantara, and Reguler in semester 1 or 2. `companionDorm` is the dorm
 * of their kakak pendamping duty while it is Aktif, and null otherwise.
 * `chosen` is the choice made by hand, null without one.
 */
export function dormOf(
  student: ResidentFacts,
  semester: number | null,
  companionDorm: DormId | null,
  chosen: ChosenDorm | null,
): DormId | null {
  if (student.status !== "active") return null;
  if (companionDorm !== null) return companionDorm;
  if (chosen !== null) return chosen.dorm;
  const isMan = student.sex === "male";
  if (student.isInternational || student.isSeedling) {
    return isMan ? "wismantara_putra" : "wismantara_putri";
  }
  if (student.entryPath !== "regular") return null;
  if (!isDormSemester(semester)) return null;
  return isMan ? "cipta_bakti" : "dana_rakca";
}
