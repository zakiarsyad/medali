import { and, desc, eq, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  mentorEvaluations,
  mentorGroups,
  mentorSurveyResults,
  studentSurveyPeriods,
  studyPrograms,
  surveyResultFixings,
} from "@/db/schema";
import type { GroupCodeParts } from "@/ui/group-code";
import { evaluationAverage } from "./evaluation-result";
import { groupsVisibleTo } from "./visible-groups";

/** How many evaluations "Evaluasi terbaru" shows. */
export const LATEST_EVALUATIONS = 20;

/**
 * Where a line of the evaluation history comes from: the form of Kepala
 * Unit, or the students' survey that Kepala Unit fixed.
 */
export type EvaluationSource = "head_of_unit" | "student_survey";

/** One line of the evaluation history as the lists show it. The NIP of nobody is read. */
export interface ListedEvaluation {
  id: string;
  source: EvaluationSource;
  period: Pick<AcademicPeriod, "startYear" | "term">;
  group: GroupCodeParts;
  /** The mentor who was evaluated. */
  mentorName: string;
  /** Null for a line of the survey, which has no such value. */
  activity: number | null;
  attendance: number | null;
  achievement: number;
  feedback: number;
  /** "Nilai evaluasi". */
  average: number;
  note: string | null;
  /** How many of the group's members answered, for a line of the survey. */
  respondents: { answered: number; members: number } | null;
  /** When it was saved last, or fixed. */
  evaluatedAt: Date;
  /** Who saved it, or fixed it. */
  evaluatorName: string;
}

const evaluator = alias(accounts, "evaluator");

const GROUP = {
  cohortYear: mentorGroups.cohortYear,
  entryPath: mentorGroups.entryPath,
  number: mentorGroups.number,
  programCode: studyPrograms.code,
};

const PERIOD = {
  startYear: academicPeriods.startYear,
  term: academicPeriods.term,
};

/**
 * The evaluations of Kepala Unit an account with this limit may see that
 * meet a condition, the one saved last first. An evaluation is seen
 * through its group: one of a group outside the limit, or of an ended
 * group, is left out.
 */
async function readHeadEvaluations(
  db: Database,
  limit: RowLimit,
  condition: SQL | undefined,
  most: number | undefined,
): Promise<ListedEvaluation[]> {
  const query = db
    .select({
      id: mentorEvaluations.id,
      period: PERIOD,
      group: GROUP,
      mentorName: accounts.name,
      activity: mentorEvaluations.activity,
      attendance: mentorEvaluations.attendance,
      achievement: mentorEvaluations.achievement,
      feedback: mentorEvaluations.feedback,
      note: mentorEvaluations.note,
      evaluatedAt: mentorEvaluations.evaluatedAt,
      evaluatorName: evaluator.name,
    })
    .from(mentorEvaluations)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorEvaluations.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, mentorEvaluations.periodId),
    )
    .innerJoin(accounts, eq(accounts.id, mentorEvaluations.mentorId))
    .innerJoin(evaluator, eq(evaluator.id, mentorEvaluations.evaluatedBy))
    .where(and(groupsVisibleTo(limit), condition))
    .orderBy(desc(mentorEvaluations.evaluatedAt), desc(mentorEvaluations.id))
    .$dynamic();
  const rows = most === undefined ? await query : await query.limit(most);
  return rows.map((row) => ({
    ...row,
    source: "head_of_unit",
    average: evaluationAverage(row),
    respondents: null,
  }));
}

/** The same for the lines the survey results were fixed into. */
async function readSurveyLines(
  db: Database,
  limit: RowLimit,
  condition: SQL | undefined,
  most: number | undefined,
): Promise<ListedEvaluation[]> {
  const query = db
    .select({
      id: mentorSurveyResults.id,
      period: PERIOD,
      group: GROUP,
      mentorName: accounts.name,
      achievement: mentorSurveyResults.achievement,
      feedback: mentorSurveyResults.feedback,
      average: mentorSurveyResults.score,
      answered: mentorSurveyResults.respondents,
      members: mentorSurveyResults.members,
      evaluatedAt: surveyResultFixings.fixedAt,
      evaluatorName: evaluator.name,
    })
    .from(mentorSurveyResults)
    .innerJoin(
      surveyResultFixings,
      eq(surveyResultFixings.id, mentorSurveyResults.fixingId),
    )
    .innerJoin(
      studentSurveyPeriods,
      eq(studentSurveyPeriods.id, surveyResultFixings.surveyPeriodId),
    )
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, studentSurveyPeriods.periodId),
    )
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorSurveyResults.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .innerJoin(accounts, eq(accounts.id, mentorSurveyResults.mentorId))
    .innerJoin(evaluator, eq(evaluator.id, surveyResultFixings.fixedBy))
    .where(and(groupsVisibleTo(limit), condition))
    .orderBy(desc(surveyResultFixings.fixedAt), desc(mentorSurveyResults.id))
    .$dynamic();
  const rows = most === undefined ? await query : await query.limit(most);
  return rows.map(({ answered, members, ...row }) => ({
    ...row,
    source: "student_survey",
    activity: null,
    attendance: null,
    note: null,
    respondents: { answered, members },
  }));
}

function savedLastFirst(one: ListedEvaluation, other: ListedEvaluation) {
  return other.evaluatedAt.getTime() - one.evaluatedAt.getTime();
}

/**
 * The lines of both sources that meet the conditions, the one saved or
 * fixed last first, `most` of them at most.
 */
async function readHistory(
  db: Database,
  limit: RowLimit,
  head: SQL | undefined,
  survey: SQL | undefined,
  most?: number,
): Promise<ListedEvaluation[]> {
  const [heads, surveys] = await Promise.all([
    readHeadEvaluations(db, limit, head, most),
    readSurveyLines(db, limit, survey, most),
  ]);
  const all = [...heads, ...surveys].sort(savedLastFirst);
  return most === undefined ? all : all.slice(0, most);
}

/** "Evaluasi terbaru": the 20 lines saved or fixed last. */
export function listLatestEvaluations(
  db: Database,
  limit: RowLimit,
): Promise<ListedEvaluation[]> {
  return readHistory(db, limit, undefined, undefined, LATEST_EVALUATIONS);
}

/** Every line of one group, whoever its mentor was then. */
export function listGroupEvaluations(
  db: Database,
  limit: RowLimit,
  groupId: string,
): Promise<ListedEvaluation[]> {
  return readHistory(
    db,
    limit,
    eq(mentorEvaluations.groupId, groupId),
    eq(mentorSurveyResults.groupId, groupId),
  );
}

/** Every line of one mentor, in each group they were evaluated in. */
export function listMentorEvaluations(
  db: Database,
  limit: RowLimit,
  mentorId: string,
): Promise<ListedEvaluation[]> {
  return readHistory(
    db,
    limit,
    eq(mentorEvaluations.mentorId, mentorId),
    eq(mentorSurveyResults.mentorId, mentorId),
  );
}
