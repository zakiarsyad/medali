import { and, count, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  studentSurveyAnswers,
  studentSurveyPeriods,
  students,
  studyPrograms,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { MEMBERS } from "@/mentoring/member-count";
import { SURVEY_STATEMENTS } from "@/mentoring/survey-statements";
import { USED_SURVEY_ANSWER } from "@/mentoring/used-survey-answer";
import { readGroupReratas } from "./medali-averages";
import {
  type MentorSums,
  type SurveyGroup,
  type SurveyGroupRow,
  surveyGroupRows,
} from "./survey-group-list";
import type { ResultPeriod } from "./survey-result-periods";
import { groupsVisibleTo } from "./visible-groups";

/** The score of one statement of an answer, counted from 1 as the database counts. */
export function statementScore(place: number) {
  return sql<number>`${studentSurveyAnswers.scores}[${sql.raw(String(place + 1))}]`;
}

/**
 * For a read of answers: the answer of a student who is today an Aktif
 * member of the group it was sent for, one of the members the group is
 * counted with.
 */
const FROM_COUNTED_MEMBER = sql`exists (
  select 1 from ${mentorGroupMembers}
  inner join ${students} on ${students.id} = ${mentorGroupMembers.studentId}
  where ${mentorGroupMembers.studentId} = ${studentSurveyAnswers.studentId}
    and ${mentorGroupMembers.groupId} = ${studentSurveyAnswers.groupId}
    and ${ACTIVE_MEMBER}
)`;

/**
 * How many of the answers came from students who are no Aktif member of
 * the group today: on Cuti, Non aktif or in another group by now. Each
 * is counted among the members, so Responden never passes 100%.
 */
const FROM_OTHERS =
  sql<number>`count(*) filter (where not ${FROM_COUNTED_MEMBER})`.mapWith(
    Number,
  );

/** The sum of the eight scores of an answer. */
const ANSWER_TOTAL = sql.join(
  SURVEY_STATEMENTS.map((_, place) => statementScore(place)),
  sql` + `,
);

/** The mentor line that held a group on a day. */
function heldOn(day: string) {
  return and(
    eq(mentorGroupMentors.groupId, mentorGroups.id),
    lte(mentorGroupMentors.startsOn, day),
    or(isNull(mentorGroupMentors.endsOn), gt(mentorGroupMentors.endsOn, day)),
  );
}

/**
 * The groups in force an account with this limit may see that had
 * started by a day, each with its Aktif members and the mentor who held
 * it on that day.
 */
export function readSurveyGroups(
  db: Database,
  limit: RowLimit,
  day: string,
): Promise<SurveyGroup[]> {
  return db
    .select({
      id: mentorGroups.id,
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
      studyProgram: studyPrograms.name,
      members: MEMBERS,
      mentorId: accounts.id,
      mentorName: accounts.name,
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(mentorGroupMentors, heldOn(day))
    .leftJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(and(groupsVisibleTo(limit), lte(mentorGroups.startsOn, day)));
}

/**
 * How many answers of a survey period each of these groups sent for each
 * mentor, the sum of their scores, and how many of them came from
 * students who are no Aktif member of the group today. Every answer that
 * was sent counts, whatever its student is today: one that dropped out
 * would show, by the change, what that student said. Only the sums leave
 * the database; the answers of a cancelled period count for nothing.
 */
export async function readMentorSums(
  db: Database,
  surveyPeriodId: string,
  groupIds: string[],
): Promise<MentorSums[]> {
  if (groupIds.length === 0) return [];
  const rows = await db
    .select({
      groupId: studentSurveyAnswers.groupId,
      mentorId: studentSurveyAnswers.mentorId,
      mentorName: accounts.name,
      answers: count(),
      total: sql<number>`sum(${ANSWER_TOTAL})`.mapWith(Number),
      others: FROM_OTHERS,
    })
    .from(studentSurveyAnswers)
    .innerJoin(
      studentSurveyPeriods,
      and(
        eq(studentSurveyPeriods.id, studentSurveyAnswers.surveyPeriodId),
        USED_SURVEY_ANSWER,
      ),
    )
    .innerJoin(accounts, eq(accounts.id, studentSurveyAnswers.mentorId))
    .where(
      and(
        eq(studentSurveyAnswers.surveyPeriodId, surveyPeriodId),
        inArray(studentSurveyAnswers.groupId, groupIds),
      ),
    )
    .groupBy(
      studentSurveyAnswers.groupId,
      studentSurveyAnswers.mentorId,
      accounts.name,
    );
  return rows;
}

/**
 * The rows of "Hasil evaluasi per kelompok" of a period, for an account
 * with this limit: every group it may see, with the sums of its answers
 * and its Capaian karakter. Once the period is over, Capaian karakter is
 * the one of its closing day, so it stays as it was then.
 */
export async function readSurveyGroupRows(
  db: Database,
  limit: RowLimit,
  period: ResultPeriod,
): Promise<SurveyGroupRow[]> {
  const day = period.numbersDay;
  const groups = await readSurveyGroups(db, limit, day);
  const groupIds = groups.map((group) => group.id);
  // One read for every group, not one for each.
  const [sums, reratas] = await Promise.all([
    readMentorSums(db, period.id, groupIds),
    readGroupReratas(db, limit, groupIds, day),
  ]);
  return surveyGroupRows(groups, sums, reratas, period.achievementWeight);
}
