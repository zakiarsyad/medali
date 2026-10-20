import { and, count, eq } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  mentorGroupMembers,
  mentorGroups,
  studentSurveyAnswers,
  studentSurveyPeriods,
  students,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { surveyRunsOn } from "@/mentoring/running-survey-period";
import { type SurveyStatus, surveyStatus } from "@/mentoring/survey-status";
import { USED_SURVEY_ANSWER } from "@/mentoring/used-survey-answer";
import { groupsVisibleTo } from "./visible-groups";

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
  /** How many students can answer, among those the account counts. */
  respondentPool: number;
  /** "Responden": how many of those students sent an answer. */
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

/**
 * How many students can answer a survey: the Aktif members of the groups
 * in force that the limit holds. A student on Cuti is not counted.
 */
async function countRespondentPool(
  db: Database,
  limit: RowLimit,
): Promise<number> {
  const [pool] = await db
    .select({ students: count() })
    .from(mentorGroupMembers)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMembers.groupId))
    .innerJoin(
      students,
      and(eq(students.id, mentorGroupMembers.studentId), ACTIVE_MEMBER),
    )
    .where(groupsVisibleTo(limit));
  return pool?.students ?? 0;
}

/** The answers of the period that runs on a day. */
function answersOfRunning(today: string) {
  return and(
    eq(studentSurveyPeriods.id, studentSurveyAnswers.surveyPeriodId),
    surveyRunsOn(today),
    USED_SURVEY_ANSWER,
  );
}

/** How many answers the period that runs on a day has. */
async function countAnswers(db: Database, today: string): Promise<number> {
  const [answers] = await db
    .select({ answers: count() })
    .from(studentSurveyAnswers)
    .innerJoin(studentSurveyPeriods, answersOfRunning(today));
  return answers?.answers ?? 0;
}

/**
 * How many of the students who can answer, among those the limit holds,
 * sent an answer in the period that runs on a day. A student who
 * answered and is on Cuti now is not counted, as they are not among the
 * students who can answer.
 */
async function countAnswered(
  db: Database,
  limit: RowLimit,
  today: string,
): Promise<number> {
  const [answered] = await db
    .select({ students: count() })
    .from(studentSurveyAnswers)
    .innerJoin(studentSurveyPeriods, answersOfRunning(today))
    .innerJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.studentId, studentSurveyAnswers.studentId),
    )
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMembers.groupId))
    .innerJoin(
      students,
      and(eq(students.id, mentorGroupMembers.studentId), ACTIVE_MEMBER),
    )
    .where(groupsVisibleTo(limit));
  return answered?.students ?? 0;
}

/**
 * The survey period that runs on a day, as its card shows it, or null
 * when none runs. `respondents` holds the students the account counts as
 * able to answer. The period and its numbers are read at the same time.
 */
export async function readRunningSurveyCard(
  db: Database,
  respondents: RowLimit,
  today: string,
): Promise<RunningSurveyCard | null> {
  const [[running], respondentPool, answered, answers] = await Promise.all([
    readRunningPeriod(db, today),
    countRespondentPool(db, respondents),
    countAnswered(db, respondents, today),
    countAnswers(db, today),
  ]);
  if (!running) return null;
  const { startYear, term, closedAt, ...shown } = running;
  return {
    ...shown,
    period: { startYear, term },
    status: surveyStatus({ ...shown, closedAt }, today),
    respondentPool,
    answered,
    answers,
  };
}
