import type { AcademicPeriod } from "./academic-period";

/**
 * The period that runs on a day: the one the day falls in, or else the one
 * that ended last before it. Only a day before the first period has none.
 * Periods never overlap, so this is the one that started last by that day.
 */
export function runningPeriodOn<P extends Pick<AcademicPeriod, "startsOn">>(
  periods: readonly P[],
  day: string,
): P | null {
  let running: P | null = null;
  for (const period of periods) {
    if (period.startsOn > day) continue;
    if (running === null || period.startsOn > running.startsOn) {
      running = period;
    }
  }
  return running;
}
