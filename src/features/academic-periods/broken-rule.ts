import { periodTitle } from "@/academic-periods/period-labels";
import type { Database } from "@/db/connect";
import type { NewPeriod } from "./period-input";
import { findOverlap, overlapRefusal } from "./period-overlap";

export type BrokenRule = "same_year_and_term" | "overlap";

interface Refusal {
  ok: false;
  error: string;
}

/** The rules the database keeps on the periods, by the name it gives them. */
const RULES: Record<string, BrokenRule> = {
  academic_periods_year_and_term: "same_year_and_term",
  academic_periods_days_do_not_overlap: "overlap",
};

function constraintName(error: object): string | null {
  if (!("constraint_name" in error)) return null;
  return typeof error.constraint_name === "string"
    ? error.constraint_name
    : null;
}

/**
 * Which rule on the periods the database refused a save for, or null for
 * any other error. The error of the database may be wrapped in another.
 */
export function brokenRule(error: unknown): BrokenRule | null {
  let current = error;
  while (typeof current === "object" && current !== null) {
    const name = constraintName(current);
    if (name !== null) return RULES[name] ?? null;
    current = "cause" in current ? current.cause : null;
  }
  return null;
}

/** What a save answers when the same year and Ganjil or Genap exists. */
export function duplicateRefusal(
  period: Pick<NewPeriod, "startYear" | "term">,
): Refusal {
  return { ok: false, error: `Periode ${periodTitle(period)} sudah ada.` };
}

/**
 * What a save answers after the database refused it, as happens when two
 * saves arrive at the same moment and both pass the checks made before
 * saving. Any other error is thrown again.
 */
export async function refusalAfterError(
  db: Database,
  error: unknown,
  period: NewPeriod,
  exceptId?: string,
): Promise<Refusal> {
  const rule = brokenRule(error);
  if (rule === "same_year_and_term") return duplicateRefusal(period);
  if (rule !== "overlap") throw error;
  const overlapped = await findOverlap(db, period, exceptId);
  if (!overlapped) throw error;
  return overlapRefusal(overlapped);
}
