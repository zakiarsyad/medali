import { and, desc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  mentorEvaluations,
  mentorGroupMentors,
  mentorGroups,
  mentorSurveyResults,
  studentSurveyPeriods,
  surveyResultFixings,
} from "@/db/schema";
import { evaluationAverage, resultOf } from "./evaluation-result";
import { groupsVisibleTo } from "./visible-groups";

/**
 * "Evaluasi terakhir" of groups or of mentors, by the id of each: its
 * Nilai evaluasi, from either source of the evaluation history.
 */
export type LastEvaluations = Map<string, number>;

export const SCORES = {
  activity: mentorEvaluations.activity,
  attendance: mentorEvaluations.attendance,
  achievement: mentorEvaluations.achievement,
  feedback: mentorEvaluations.feedback,
};

/** A line of the history, with what decides which is the newest. */
export interface DatedAverage {
  /** The id of the group or mentor it is the line of. */
  id: string;
  /** The first day of the academic period it is of. */
  periodStartsOn: string;
  /** When it was saved or fixed. */
  savedAt: Date;
  average: number;
}

function isNewer(one: DatedAverage, other: DatedAverage): boolean {
  if (one.periodStartsOn !== other.periodStartsOn) {
    return one.periodStartsOn > other.periodStartsOn;
  }
  return one.savedAt > other.savedAt;
}

/**
 * The newest line of each id, of whichever source: the one of the latest
 * academic period, and among those of one period the one saved last.
 */
export function newestOf(lines: readonly DatedAverage[]): LastEvaluations {
  const newest = new Map<string, DatedAverage>();
  for (const line of lines) {
    const found = newest.get(line.id);
    if (found === undefined || isNewer(line, found)) newest.set(line.id, line);
  }
  const averages: LastEvaluations = new Map();
  for (const [id, line] of newest) averages.set(id, line.average);
  return averages;
}

/** Whether the last line is read for each group, or for each mentor. */
type LastOf = "group" | "mentor";

/** The line that says the evaluated mentor still holds the group today. */
const OF_MENTOR_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorEvaluations.groupId),
  eq(mentorGroupMentors.mentorId, mentorEvaluations.mentorId),
  isNull(mentorGroupMentors.endsOn),
);

/** The same for a line of the survey. */
const OF_SURVEY_MENTOR_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorSurveyResults.groupId),
  eq(mentorGroupMentors.mentorId, mentorSurveyResults.mentorId),
  isNull(mentorGroupMentors.endsOn),
);

/**
 * The newest evaluation of Kepala Unit of each group or mentor that an
 * account with this limit may see and that meets a condition. For a
 * group, only an evaluation of the mentor who holds it today counts.
 */
async function lastHeadEvaluations(
  db: Database,
  limit: RowLimit,
  of: LastOf,
  condition: SQL | undefined,
): Promise<DatedAverage[]> {
  const key =
    of === "group" ? mentorEvaluations.groupId : mentorEvaluations.mentorId;
  const query = db
    .selectDistinctOn([key], {
      id: key,
      periodStartsOn: academicPeriods.startsOn,
      savedAt: mentorEvaluations.evaluatedAt,
      ...SCORES,
    })
    .from(mentorEvaluations)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorEvaluations.groupId))
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, mentorEvaluations.periodId),
    )
    .$dynamic();
  const held =
    of === "group"
      ? query.innerJoin(mentorGroupMentors, OF_MENTOR_TODAY)
      : query;
  const rows = await held
    .where(and(groupsVisibleTo(limit), condition))
    .orderBy(
      key,
      desc(academicPeriods.startsOn),
      desc(mentorEvaluations.evaluatedAt),
    );
  return rows.map(
    ({ activity, attendance, achievement, feedback, ...line }) => ({
      ...line,
      average: evaluationAverage({
        activity,
        attendance,
        achievement,
        feedback,
      }),
    }),
  );
}

/** The same for the lines the survey results were fixed into. */
async function lastSurveyLines(
  db: Database,
  limit: RowLimit,
  of: LastOf,
  condition: SQL | undefined,
): Promise<DatedAverage[]> {
  const key =
    of === "group" ? mentorSurveyResults.groupId : mentorSurveyResults.mentorId;
  const query = db
    .selectDistinctOn([key], {
      id: key,
      periodStartsOn: academicPeriods.startsOn,
      savedAt: surveyResultFixings.fixedAt,
      average: mentorSurveyResults.score,
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
    .$dynamic();
  const held =
    of === "group"
      ? query.innerJoin(mentorGroupMentors, OF_SURVEY_MENTOR_TODAY)
      : query;
  return held
    .where(and(groupsVisibleTo(limit), condition))
    .orderBy(
      key,
      desc(academicPeriods.startsOn),
      desc(surveyResultFixings.fixedAt),
    );
}

/**
 * "Evaluasi terakhir" of the groups an account with this limit may see
 * that meet the conditions: the newest line of the mentor who holds the
 * group today, of either source. One of an earlier mentor says nothing of
 * the mentor of today, so a group whose mentor was replaced starts
 * without one.
 */
async function lastOfGroups(
  db: Database,
  limit: RowLimit,
  head: SQL | undefined,
  survey: SQL | undefined,
): Promise<LastEvaluations> {
  const [heads, surveys] = await Promise.all([
    lastHeadEvaluations(db, limit, "group", head),
    lastSurveyLines(db, limit, "group", survey),
  ]);
  return newestOf([...heads, ...surveys]);
}

/**
 * "Evaluasi terakhir" of each of these groups, in one read of each
 * source for all of them. A group that has none is not in the answer.
 */
export async function readLastGroupEvaluations(
  db: Database,
  limit: RowLimit,
  groupIds: string[],
): Promise<LastEvaluations> {
  if (groupIds.length === 0) return new Map();
  return lastOfGroups(
    db,
    limit,
    inArray(mentorEvaluations.groupId, groupIds),
    inArray(mentorSurveyResults.groupId, groupIds),
  );
}

/**
 * "Evaluasi terakhir" of each of these mentors, in one read of each
 * source for all of them: over every group an account with this limit
 * may see, the line of the latest period, and among those of one period
 * the one saved last. A mentor who has none is not in the answer.
 */
export async function readLastMentorEvaluations(
  db: Database,
  limit: RowLimit,
  mentorIds: string[],
): Promise<LastEvaluations> {
  if (mentorIds.length === 0) return new Map();
  const [heads, surveys] = await Promise.all([
    lastHeadEvaluations(
      db,
      limit,
      "mentor",
      inArray(mentorEvaluations.mentorId, mentorIds),
    ),
    lastSurveyLines(
      db,
      limit,
      "mentor",
      inArray(mentorSurveyResults.mentorId, mentorIds),
    ),
  ]);
  return newestOf([...heads, ...surveys]);
}

/**
 * "Evaluasi kurang": how many of the groups an account with this limit
 * may see have Kurang as their last evaluation, of either source.
 */
export async function countPoorGroups(
  db: Database,
  limit: RowLimit,
): Promise<number> {
  const last = await lastOfGroups(db, limit, undefined, undefined);
  let poor = 0;
  for (const average of last.values()) {
    if (resultOf(average) === "poor") poor++;
  }
  return poor;
}
