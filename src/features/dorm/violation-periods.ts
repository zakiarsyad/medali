import type { AcademicPeriod } from "@/academic-periods/academic-period";

/*
 * Which violation days belong to an academic period. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

/**
 * The violation days of a period: from its first day, up to the first day
 * of the period that starts next, or with no end for the last one. This
 * is the period "Academic period" gives for each of those days: the one
 * that started last by then.
 */
export interface PeriodDays {
  from: string;
  /** The first day that belongs to a later period, or null for none. */
  before: string | null;
}

type Dated = Pick<AcademicPeriod, "id" | "startsOn">;

/** The violation days of the period with the key, or null for no such period. */
export function periodDays(
  periods: readonly Dated[],
  periodId: string,
): PeriodDays | null {
  const period = periods.find((each) => each.id === periodId);
  if (!period) return null;
  let before: string | null = null;
  for (const each of periods) {
    if (each.startsOn <= period.startsOn) continue;
    if (before === null || each.startsOn < before) before = each.startsOn;
  }
  return { from: period.startsOn, before };
}
