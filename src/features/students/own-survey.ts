import { and, eq, lte } from "drizzle-orm";
import { periodTitle } from "@/academic-periods/period-labels";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  studentSurveyAnswers,
  studentSurveyPeriods,
} from "@/db/schema";
import { surveyRunsOn } from "@/mentoring/running-survey-period";
import { mentorLabel } from "@/ui/mentor-label";
import { readSurveyMentor } from "./survey-mentor";

/** An answer the student sent, as the card shows it back to them. */
export interface SentSurvey {
  scores: number[];
  suggestion: string | null;
  sentAt: Date;
  /** The mentor the answer counts for: the one named at the latest send. */
  mentorName: string;
}

/** What "Survei kepuasan pengasuhan" on Profil saya shows. */
export interface OwnSurvey {
  surveyPeriodId: string;
  /** The academic period the survey is about, such as Ganjil 2026/2027. */
  periodTitle: string;
  /** The last day the student can answer. */
  endsOn: string;
  /** The mentor of today, whom the form rates. */
  mentorId: string;
  mentorName: string;
  /** Null until the student sends an answer. */
  sent: SentSurvey | null;
}

/** The survey period that is Dibuka on a day: it runs and has begun. */
async function readOpenPeriod(db: Database, today: string) {
  const [open] = await db
    .select({
      id: studentSurveyPeriods.id,
      endsOn: studentSurveyPeriods.endsOn,
      startYear: academicPeriods.startYear,
      term: academicPeriods.term,
    })
    .from(studentSurveyPeriods)
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, studentSurveyPeriods.periodId),
    )
    .where(and(surveyRunsOn(today), lte(studentSurveyPeriods.startsOn, today)));
  return open ?? null;
}

async function readSent(
  db: Database,
  surveyPeriodId: string,
  studentId: string,
): Promise<SentSurvey | null> {
  const [sent] = await db
    .select({
      scores: studentSurveyAnswers.scores,
      suggestion: studentSurveyAnswers.suggestion,
      sentAt: studentSurveyAnswers.sentAt,
      name: accounts.name,
      title: accounts.title,
    })
    .from(studentSurveyAnswers)
    .innerJoin(accounts, eq(accounts.id, studentSurveyAnswers.mentorId))
    .where(
      and(
        eq(studentSurveyAnswers.surveyPeriodId, surveyPeriodId),
        eq(studentSurveyAnswers.studentId, studentId),
      ),
    );
  if (!sent) return null;
  const { name, title, ...answer } = sent;
  return { ...answer, mentorName: mentorLabel({ name, title }) };
}

/**
 * The survey card of the student of the account, on a day, or null when
 * it is not shown: for an account without the right, while no period is
 * Dibuka, and for a student who is not Aktif or has no pengasuh. Only
 * the student's own answer is ever read: which student is never asked
 * from outside.
 */
export async function readOwnSurvey(
  db: Database,
  account: AccountForAccess,
  today: string,
): Promise<OwnSurvey | null> {
  if (!may(account.roles, "answer_own_survey")) return null;
  const { studentId } = account;
  if (studentId === null) return null;
  const [period, mentor] = await Promise.all([
    readOpenPeriod(db, today),
    readSurveyMentor(db, studentId),
  ]);
  if (period === null || mentor === null) return null;
  return {
    surveyPeriodId: period.id,
    periodTitle: periodTitle(period),
    endsOn: period.endsOn,
    mentorId: mentor.mentorId,
    mentorName: mentor.mentorName,
    sent: await readSent(db, period.id, studentId),
  };
}
