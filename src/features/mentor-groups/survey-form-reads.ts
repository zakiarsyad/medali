import { isNull } from "drizzle-orm";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import { studentSurveyPeriods } from "@/db/schema";
import { type SurveyFormStart, surveyFormStart } from "./survey-form-start";

/** The academic periods that have a survey period which was not cancelled. */
async function readOpenedPeriodIds(db: Database): Promise<string[]> {
  const opened = await db
    .selectDistinct({ periodId: studentSurveyPeriods.periodId })
    .from(studentSurveyPeriods)
    .where(isNull(studentSurveyPeriods.cancelledAt));
  return opened.map((each) => each.periodId);
}

/**
 * What "Buka periode evaluasi pengasuhan" opens with on a day. The
 * academic periods and those opened before are read at the same time.
 */
export async function readSurveyFormStart(
  db: Database,
  today: string,
): Promise<SurveyFormStart> {
  const [periods, openedPeriodIds] = await Promise.all([
    readAcademicPeriods(db),
    readOpenedPeriodIds(db),
  ]);
  return surveyFormStart(periods, openedPeriodIds, today);
}
