import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  type SQL,
  sql,
} from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  mentorEvaluations,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";
import type { EvaluationScores } from "./evaluation-aspects";
import { POOR_TOTAL_BELOW } from "./evaluation-result";
import { groupsVisibleTo } from "./visible-groups";

/** "Evaluasi terakhir" of groups or of mentors, by the id of each. */
export type LastEvaluations = Map<string, EvaluationScores>;

export const SCORES = {
  activity: mentorEvaluations.activity,
  attendance: mentorEvaluations.attendance,
  achievement: mentorEvaluations.achievement,
  feedback: mentorEvaluations.feedback,
};

/** The line that says the evaluated mentor still holds the group today. */
const OF_MENTOR_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorEvaluations.groupId),
  eq(mentorGroupMentors.mentorId, mentorEvaluations.mentorId),
  isNull(mentorGroupMentors.endsOn),
);

const OF_PERIOD = eq(academicPeriods.id, mentorEvaluations.periodId);

/**
 * "Evaluasi terakhir" of each group an account with this limit may see:
 * the evaluation of the mentor who holds the group today, for the latest
 * period. One of an earlier mentor says nothing of the mentor of today,
 * so a group whose mentor was replaced starts without one. A group has
 * one evaluation for a period at most, so the period alone decides.
 */
function lastOfGroups(db: Database, limit: RowLimit, condition?: SQL) {
  return db
    .selectDistinctOn([mentorEvaluations.groupId], {
      groupId: mentorEvaluations.groupId,
      ...SCORES,
    })
    .from(mentorEvaluations)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorEvaluations.groupId))
    .innerJoin(mentorGroupMentors, OF_MENTOR_TODAY)
    .innerJoin(academicPeriods, OF_PERIOD)
    .where(and(groupsVisibleTo(limit), condition))
    .orderBy(mentorEvaluations.groupId, desc(academicPeriods.startsOn));
}

/**
 * "Evaluasi terakhir" of each of these groups, in one read for all of
 * them. A group that has none is not in the answer.
 */
export async function readLastGroupEvaluations(
  db: Database,
  limit: RowLimit,
  groupIds: string[],
): Promise<LastEvaluations> {
  if (groupIds.length === 0) return new Map();
  const rows = await lastOfGroups(
    db,
    limit,
    inArray(mentorEvaluations.groupId, groupIds),
  );
  return new Map(rows.map(({ groupId, ...scores }) => [groupId, scores]));
}

/**
 * "Evaluasi terakhir" of each of these mentors, in one read for all of
 * them: over every group an account with this limit may see, the
 * evaluation of the latest period, and among those of one period the one
 * saved last. A mentor who has none is not in the answer.
 */
export async function readLastMentorEvaluations(
  db: Database,
  limit: RowLimit,
  mentorIds: string[],
): Promise<LastEvaluations> {
  if (mentorIds.length === 0) return new Map();
  const rows = await db
    .selectDistinctOn([mentorEvaluations.mentorId], {
      mentorId: mentorEvaluations.mentorId,
      ...SCORES,
    })
    .from(mentorEvaluations)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorEvaluations.groupId))
    .innerJoin(academicPeriods, OF_PERIOD)
    .where(
      and(
        groupsVisibleTo(limit),
        inArray(mentorEvaluations.mentorId, mentorIds),
      ),
    )
    .orderBy(
      mentorEvaluations.mentorId,
      desc(academicPeriods.startsOn),
      desc(mentorEvaluations.evaluatedAt),
    );
  return new Map(rows.map(({ mentorId, ...scores }) => [mentorId, scores]));
}

/**
 * "Evaluasi kurang": how many of the groups an account with this limit
 * may see have Kurang as their last evaluation. The database counts, by
 * the total a check keeps the same as the rule of the result.
 */
export async function countPoorGroups(
  db: Database,
  limit: RowLimit,
): Promise<number> {
  const last = lastOfGroups(db, limit).as("last");
  const total = sql`${last.activity} + ${last.attendance} + ${last.achievement} + ${last.feedback}`;
  const [counted] = await db
    .select({ poor: count() })
    .from(last)
    .where(sql`${total} < ${POOR_TOTAL_BELOW}`);
  return counted?.poor ?? 0;
}
