import { asc } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { studentSurveyPeriods } from "@/db/schema";

/** Made-up survey periods for the checks of every area that reads them. */

type NewSurveyPeriod = typeof studentSurveyPeriods.$inferInsert;

type TestSurveyPeriod = Pick<
  NewSurveyPeriod,
  "periodId" | "openedBy" | "startsOn" | "endsOn"
> &
  Partial<NewSurveyPeriod>;

/** A stored survey period with weights of 50 and 50, opened now unless it says when. */
export async function addTestSurveyPeriod(
  db: Database,
  period: TestSurveyPeriod,
): Promise<string> {
  const [added] = await db
    .insert(studentSurveyPeriods)
    .values({ achievementWeight: 50, openedAt: new Date(), ...period })
    .returning({ id: studentSurveyPeriods.id });
  if (!added) throw new Error("The survey period was not added.");
  return added.id;
}

/** Every stored survey period, the one opened first first. */
export function testSurveyPeriods(db: Database) {
  return db
    .select()
    .from(studentSurveyPeriods)
    .orderBy(asc(studentSurveyPeriods.openedAt));
}
