import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { runningPeriodOn } from "@/academic-periods/running-period";

type Started = Pick<AcademicPeriod, "startsOn">;

/** The period that started last before another one. Null when none did. */
function periodBefore<P extends Started>(
  periods: readonly P[],
  period: P,
): P | null {
  let before: P | null = null;
  for (const candidate of periods) {
    if (candidate.startsOn >= period.startsOn) continue;
    if (before === null || candidate.startsOn > before.startsOn) {
      before = candidate;
    }
  }
  return before;
}

/**
 * The periods a mentor can be evaluated for on a day: the running period
 * first, then the one before it when there is one. None on a day before
 * the first period.
 */
export function evaluationPeriods<P extends Started>(
  periods: readonly P[],
  day: string,
): P[] {
  const running = runningPeriodOn(periods, day);
  if (running === null) return [];
  const before = periodBefore(periods, running);
  return before === null ? [running] : [running, before];
}

type Ended = Pick<AcademicPeriod, "endsOn">;

/**
 * Whether a mentor who took a group on a day held it during a period:
 * their first day is on the last day of the period at the latest. A
 * mentor is not evaluated for a period that ended before they came.
 */
export function heldDuring(period: Ended, mentorSince: string): boolean {
  return mentorSince <= period.endsOn;
}

/** Those of the periods a mentor held the group in, in the order given. */
export function periodsHeldSince<P extends Ended>(
  periods: readonly P[],
  mentorSince: string,
): P[] {
  return periods.filter((period) => heldDuring(period, mentorSince));
}
