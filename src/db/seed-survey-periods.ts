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
export function noonOf(day: string): Date {
  return new Date(`${day}T12:00:00+07:00`);
}

/** A sample survey period as it was stored. */
export interface AddedSurveyPeriod {
  id: string;
  sample: SampleSurveyPeriod;
}

async function addSurveyPeriod(
  db: Database,
  sample: SampleSurveyPeriod,
  by: string,
): Promise<AddedSurveyPeriod> {
  const { period, openedOn, closedOn, ...values } = sample;
  const [added] = await db
    .insert(studentSurveyPeriods)
    .values({
      ...values,
      periodId: await periodIdOf(db, period),
      openedBy: by,
      openedAt: noonOf(openedOn),
      closedBy: by,
      closedAt: noonOf(closedOn),
    })
    .returning({ id: studentSurveyPeriods.id });
  if (!added) throw new Error("The sample survey period was not added.");
  return { id: added.id, sample };
}

/**
 * Adds the sample survey period as the work of the sample Kepala Unit,
 * who opened it and closed it by hand. The sample periods must be there
 * already. Gives back the periods it added.
 */
export async function addSampleSurveyPeriods(
  db: Database,
  periods: SamplePeriod[],
  by: string,
): Promise<AddedSurveyPeriod[]> {
  const added: AddedSurveyPeriod[] = [];
  for (const sample of sampleSurveyPeriods(periods)) {
    added.push(await addSurveyPeriod(db, sample, by));
  }
  return added;
}
