import { daysAfter } from "@/academic-periods/days-after";
import { daysBefore } from "@/academic-periods/days-before";
import type { SamplePeriod } from "./sample-data";

/*
 * Made-up records only. The dates and the note here are invented.
 */

export interface SampleSurveyPeriod {
  /** The academic period the survey is about. */
  period: SamplePeriod;
  startsOn: string;
  endsOn: string;
  achievementWeight: number;
  note: string;
  /** The day it was opened, before its first day. */
  openedOn: string;
  /** The day it was closed by hand. */
  closedOn: string;
}

/** How long before the end of its academic period the sample survey started. */
const DAYS_BEFORE_PERIOD_END = 60;
const LAST_DAY_AFTER = 20;
const OPENED_DAYS_BEFORE = 4;

/**
 * The one made-up survey period: three weeks near the end of the academic
 * period before the running one, closed by hand on its last day. It is
 * over, so the form to open a period shows, and choosing its Periode
 * there asks whether to open it again. Empty without a period before.
 * `periods` are the sample periods, the running one first.
 */
export function sampleSurveyPeriods(
  periods: SamplePeriod[],
): SampleSurveyPeriod[] {
  const [, before] = periods;
  if (!before) return [];
  const startsOn = daysBefore(before.endsOn, DAYS_BEFORE_PERIOD_END);
  const endsOn = daysAfter(startsOn, LAST_DAY_AFTER);
  return [
    {
      period: before,
      startsOn,
      endsOn,
      achievementWeight: 50,
      note: "Data contoh periode lalu.",
      openedOn: daysBefore(startsOn, OPENED_DAYS_BEFORE),
      closedOn: endsOn,
    },
  ];
}
