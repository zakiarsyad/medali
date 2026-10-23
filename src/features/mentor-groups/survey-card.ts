import { and, count, eq } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  studentSurveyAnswers,
  studentSurveyPeriods,
} from "@/db/schema";
import { surveyRunsOn } from "@/mentoring/running-survey-period";
import { type SurveyStatus, surveyStatus } from "@/mentoring/survey-status";
import { USED_SURVEY_ANSWER } from "@/mentoring/used-survey-answer";
import { resultNumbers, surveyGroupRows } from "./survey-group-list";
import { readMentorSums, readSurveyGroups } from "./survey-group-reads";

/** What the card of the running survey period shows. */
export interface RunningSurveyCard {
  id: string;
  /** "Periode": the academic period the survey is about. */
  period: Pick<AcademicPeriod, "startYear" | "term">;
  startsOn: string;
  endsOn: string;
  /** "Bobot capaian karakter (%)". */
  achievementWeight: number;
  note: string | null;
  openerName: string;
  /** Terjadwal or Dibuka: only a period that runs has a card. */
  status: SurveyStatus;
  /**
   * The students Responden counts, among the groups the account counts
   * that had started: the Aktif members of each group, and each student
   * who answered for it and is not one of them by now.
   */
  respondentPool: number;
  /**
   * "Responden": every answer of the period sent for one of those groups,
   * whatever its student is by now.
   */
  answered: number;
  /** Every answer of the period, which a cancel leaves unused. */
  answers: number;
}

function readRunningPeriod(db: Database, today: string) {
  return db
    .select({
      id: studentSurveyPeriods.id,
      startYear: academicPeriods.startYear,
      term: academicPeriods.term,
      startsOn: studentSurveyPeriods.startsOn,
      endsOn: studentSurveyPeriods.endsOn,
      achievementWeight: studentSurveyPeriods.achievementWeight,
      note: studentSurveyPeriods.note,
      closedAt: studentSurveyPeriods.closedAt,
      openerName: accounts.name,
    })
    .from(studentSurveyPeriods)
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, studentSurveyPeriods.periodId),
    )
    .innerJoin(accounts, eq(accounts.id, studentSurveyPeriods.openedBy))
    .where(surveyRunsOn(today));
}

/** How many answers the period that runs on a day has. */
async function countAnswers(db: Database, today: string): Promise<number> {
  const [answers] = await db
    .select({ answers: count() })
    .from(studentSurveyAnswers)
    .innerJoin(
      studentSurveyPeriods,
      and(
        eq(studentSurveyPeriods.id, studentSurveyAnswers.surveyPeriodId),
        surveyRunsOn(today),
        USED_SURVEY_ANSWER,
      ),
    );
  return answers?.answers ?? 0;
}

/**
 * The survey period that runs on a day, as its card shows it, or null
 * when none runs. `respondents` holds the students the account counts as
 * able to answer. Responden is counted as the results of the period count
 * it on that day, from the same reads, so the two never differ.
 */
export async function readRunningSurveyCard(
  db: Database,
  respondents: RowLimit,
  today: string,
): Promise<RunningSurveyCard | null> {
  const [[running], groups, answers] = await Promise.all([
    readRunningPeriod(db, today),
    readSurveyGroups(db, respondents, today),
    countAnswers(db, today),
  ]);
  if (!running) return null;
  const groupIds = groups.map((group) => group.id);
  const sums = await readMentorSums(db, running.id, groupIds);
  // Capaian karakter is not shown on the card, so no group has one here.
  const rows = surveyGroupRows(
    groups,
    sums,
    new Map(),
    running.achievementWeight,
  );
  const responden = resultNumbers(rows);
  const { startYear, term, closedAt, ...shown } = running;
  return {
    ...shown,
    period: { startYear, term },
    status: surveyStatus({ ...shown, closedAt }, today),
    respondentPool: responden.members,
    answered: responden.answers,
    answers,
  };
}
