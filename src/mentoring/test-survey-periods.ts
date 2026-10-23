import { asc } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { studentSurveyAnswers, studentSurveyPeriods } from "@/db/schema";
import { SURVEY_STATEMENTS } from "./survey-statements";

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

type NewSurveyAnswer = typeof studentSurveyAnswers.$inferInsert;

type TestSurveyAnswer = Pick<
  NewSurveyAnswer,
  "surveyPeriodId" | "studentId" | "groupId" | "mentorId"
> &
  Partial<NewSurveyAnswer>;

/** A stored answer that gives each statement a 4, sent now unless it says when. */
export async function addTestSurveyAnswer(
  db: Database,
  answer: TestSurveyAnswer,
): Promise<void> {
  await db.insert(studentSurveyAnswers).values({
    scores: SURVEY_STATEMENTS.map(() => 4),
    sentAt: new Date(),
    ...answer,
  });
}

/** Every stored survey period, the one opened first first. */
export function testSurveyPeriods(db: Database) {
  return db
    .select()
    .from(studentSurveyPeriods)
    .orderBy(asc(studentSurveyPeriods.openedAt));
}
