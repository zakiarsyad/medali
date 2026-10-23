import { and, asc, count, eq, isNotNull, sql } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  mentorGroups,
  studentSurveyAnswers,
  studentSurveyPeriods,
} from "@/db/schema";
import { SURVEY_STATEMENTS } from "@/mentoring/survey-statements";
import { USED_SURVEY_ANSWER } from "@/mentoring/used-survey-answer";
import { statementScore } from "./survey-group-reads";
import {
  isShownCount,
  type StatementSums,
  statementAverages,
} from "./survey-result";
import type { OpenedRow } from "./survey-results-address";
import { groupsVisibleTo } from "./visible-groups";

/** What the detail of a row shows: never one student's answer. */
export interface GroupSurveyDetail {
  answers: number;
  /** "Rata-rata per pernyataan", or null while fewer than 3 answered. */
  averages: number[] | null;
  /** "Saran mahasiswa (tanpa nama)", or null while fewer than 3 answered. */
  suggestions: string[] | null;
}

const NO_ANSWERS: GroupSurveyDetail = {
  answers: 0,
  averages: null,
  suggestions: null,
};

/**
 * The answers of a period for a group and one mentor, when they are used:
 * every one that was sent, whatever its student is today, as the row
 * counts them. An answer that left the set would show, by the change,
 * what that student said.
 */
function answersOf(surveyPeriodId: string, groupId: string, mentorId: string) {
  return and(
    eq(studentSurveyAnswers.surveyPeriodId, surveyPeriodId),
    eq(studentSurveyAnswers.groupId, groupId),
    eq(studentSurveyAnswers.mentorId, mentorId),
    USED_SURVEY_ANSWER,
  );
}

/** The numbers of a list the database sent, which may come as texts. */
function toNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw new Error("The sums of the statements did not come as a list.");
  }
  return value.map(Number);
}

/** The sum of the scores of each statement, in the order of the statements. */
const STATEMENT_SUMS = sql<number[]>`array[${sql.join(
  SURVEY_STATEMENTS.map(
    (_, place) => sql`coalesce(sum(${statementScore(place)}), 0)`,
  ),
  sql`, `,
)}]`.mapWith(toNumbers);

async function isGroupSeen(
  db: Database,
  limit: RowLimit,
  groupId: string,
): Promise<boolean> {
  const [found] = await db
    .select({ id: mentorGroups.id })
    .from(mentorGroups)
    .where(and(eq(mentorGroups.id, groupId), groupsVisibleTo(limit)));
  return found !== undefined;
}

/** The number of answers and the sum of each statement: only sums leave the database. */
async function readStatementSums(
  db: Database,
  surveyPeriodId: string,
  groupId: string,
  mentorId: string,
): Promise<StatementSums> {
  const [found] = await db
    .select({ answers: count(), sums: STATEMENT_SUMS })
    .from(studentSurveyAnswers)
    .innerJoin(
      studentSurveyPeriods,
      eq(studentSurveyPeriods.id, studentSurveyAnswers.surveyPeriodId),
    )
    .where(answersOf(surveyPeriodId, groupId, mentorId));
  return found ?? { answers: 0, sums: [] };
}

/**
 * The suggestions, in the order of their words, so neither the order nor
 * a date points to the student who wrote one.
 */
async function readSuggestions(
  db: Database,
  surveyPeriodId: string,
  groupId: string,
  mentorId: string,
): Promise<string[]> {
  const found = await db
    .select({ suggestion: studentSurveyAnswers.suggestion })
    .from(studentSurveyAnswers)
    .innerJoin(
      studentSurveyPeriods,
      eq(studentSurveyPeriods.id, studentSurveyAnswers.surveyPeriodId),
    )
    .where(
      and(
        answersOf(surveyPeriodId, groupId, mentorId),
        isNotNull(studentSurveyAnswers.suggestion),
      ),
    )
    .orderBy(asc(studentSurveyAnswers.suggestion));
  const suggestions: string[] = [];
  for (const { suggestion } of found) {
    if (suggestion !== null) suggestions.push(suggestion);
  }
  return suggestions;
}

/**
 * The detail of a row of "Hasil evaluasi per kelompok" for an account
 * with this limit. A group with fewer than 3 answers gets its count only:
 * its averages and its suggestions are not even read. Null for a group the
 * account may not see, or for ids that name nothing.
 */
export async function readGroupSurveyDetail(
  db: Database,
  limit: RowLimit,
  surveyPeriodId: string,
  opened: OpenedRow,
): Promise<GroupSurveyDetail | null> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(surveyPeriodId) || !isUuid(opened.groupId)) return null;
  if (!(await isGroupSeen(db, limit, opened.groupId))) return null;
  const { groupId, mentorId } = opened;
  if (mentorId === null || !isUuid(mentorId)) return NO_ANSWERS;
  const sums = await readStatementSums(db, surveyPeriodId, groupId, mentorId);
  if (!isShownCount(sums.answers)) {
    return { answers: sums.answers, averages: null, suggestions: null };
  }
  return {
    answers: sums.answers,
    averages: statementAverages(sums),
    suggestions: await readSuggestions(db, surveyPeriodId, groupId, mentorId),
  };
}
