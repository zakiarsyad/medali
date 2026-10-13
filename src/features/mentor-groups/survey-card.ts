import { and, count, eq } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  mentorGroupMembers,
  mentorGroups,
  studentSurveyPeriods,
  students,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { surveyRunsOn } from "@/mentoring/running-survey-period";
import { type SurveyStatus, surveyStatus } from "@/mentoring/survey-status";
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

/**
 * The survey period that runs on a day, as its card shows it, or null
 * when none runs. `respondents` holds the students the account counts as
 * able to answer. The period and that number are read at the same time.
 */
export async function readRunningSurveyCard(
  db: Database,
  respondents: RowLimit,
  today: string,
): Promise<RunningSurveyCard | null> {
  const [[running], respondentPool] = await Promise.all([
    readRunningPeriod(db, today),
    countRespondentPool(db, respondents),
  ]);
  if (!running) return null;
  const { startYear, term, closedAt, ...shown } = running;
  return {
    ...shown,
    period: { startYear, term },
    status: surveyStatus({ ...shown, closedAt }, today),
    respondentPool,
  };
}
