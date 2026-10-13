import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  mentorEvaluations,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";
import type { EvaluationScores } from "./evaluation-aspects";
import { groupsVisibleTo } from "./visible-groups";

export const SCORES = {
  activity: mentorEvaluations.activity,
  attendance: mentorEvaluations.attendance,
  achievement: mentorEvaluations.achievement,
  feedback: mentorEvaluations.feedback,
};

/** The line that says the evaluated mentor still holds the group today. */
export const OF_MENTOR_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorEvaluations.groupId),
  eq(mentorGroupMentors.mentorId, mentorEvaluations.mentorId),
  isNull(mentorGroupMentors.endsOn),
);

/**
 * "Evaluasi terakhir" of each of these groups, among those an account
 * with this limit may see, in one read for all of them. It is the
 * evaluation of the mentor who holds the group today, for the latest
 * period: one of an earlier mentor says nothing of the mentor of today.
 * A group that has none is not in the answer.
 */
export async function readLastGroupEvaluations(
  db: Database,
  limit: RowLimit,
  groupIds: string[],
): Promise<Map<string, EvaluationScores>> {
  if (groupIds.length === 0) return new Map();
  const rows = await db
    .selectDistinctOn([mentorEvaluations.groupId], {
      groupId: mentorEvaluations.groupId,
      ...SCORES,
    })
    .from(mentorEvaluations)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorEvaluations.groupId))
    .innerJoin(mentorGroupMentors, OF_MENTOR_TODAY)
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, mentorEvaluations.periodId),
    )
    .where(
      and(groupsVisibleTo(limit), inArray(mentorEvaluations.groupId, groupIds)),
    )
    .orderBy(mentorEvaluations.groupId, desc(academicPeriods.startsOn));
  return new Map(rows.map(({ groupId, ...scores }) => [groupId, scores]));
}
