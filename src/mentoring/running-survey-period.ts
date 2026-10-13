import { and, gte, isNull, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { studentSurveyPeriods } from "@/db/schema";

export type SurveyPeriod = typeof studentSurveyPeriods.$inferSelect;

/**
 * The name of the database's own rule that refuses a second survey
 * period while one runs.
 */
export const ONE_RUNNING_SURVEY_RULE = "student_survey_periods_one_running";

/**
 * A survey period that runs on a day: it waits for its first day or is
 * open, so it is not cancelled, not closed by hand, and its last day has
 * not passed.
 */
export function surveyRunsOn(day: string): SQL | undefined {
  return and(
    isNull(studentSurveyPeriods.cancelledAt),
    isNull(studentSurveyPeriods.closedAt),
    gte(studentSurveyPeriods.endsOn, day),
  );
}

/** The survey period that runs on a day, or null: one runs at a time. */
export async function readRunningSurveyPeriod(
  db: Database,
  day: string,
): Promise<SurveyPeriod | null> {
  const [running] = await db
    .select()
    .from(studentSurveyPeriods)
    .where(surveyRunsOn(day));
  return running ?? null;
}
