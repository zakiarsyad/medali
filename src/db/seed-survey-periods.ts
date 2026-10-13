import { and, eq } from "drizzle-orm";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  type SampleSurveyPeriod,
  sampleSurveyPeriods,
} from "./sample-survey-periods";
import { academicPeriods, studentSurveyPeriods } from "./schema";

async function periodIdOf(db: Database, period: SamplePeriod): Promise<string> {
  const [stored] = await db
    .select({ id: academicPeriods.id })
    .from(academicPeriods)
    .where(
      and(
        eq(academicPeriods.startYear, period.startYear),
        eq(academicPeriods.term, period.term),
      ),
    );
  if (!stored) {
    throw new Error("A sample survey period names a period that is missing.");
  }
  return stored.id;
}

/** The noon on campus of a day. */
function noonOf(day: string): Date {
  return new Date(`${day}T12:00:00+07:00`);
}

async function addSurveyPeriod(
  db: Database,
  sample: SampleSurveyPeriod,
  by: string,
): Promise<void> {
  const { period, openedOn, closedOn, ...values } = sample;
  await db.insert(studentSurveyPeriods).values({
    ...values,
    periodId: await periodIdOf(db, period),
    openedBy: by,
    openedAt: noonOf(openedOn),
    closedBy: by,
    closedAt: noonOf(closedOn),
  });
}

/**
 * Adds the sample survey period as the work of the sample Kepala Unit,
 * who opened it and closed it by hand. The sample periods must be there
 * already.
 */
export async function addSampleSurveyPeriods(
  db: Database,
  periods: SamplePeriod[],
  by: string,
): Promise<void> {
  for (const sample of sampleSurveyPeriods(periods)) {
    await addSurveyPeriod(db, sample, by);
  }
}
