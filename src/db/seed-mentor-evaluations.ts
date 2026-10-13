import { and, inArray, isNull } from "drizzle-orm";
import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import {
  type SampleMentorEvaluation,
  sampleMentorEvaluations,
} from "./sample-mentor-evaluations";
import {
  academicPeriods,
  mentorEvaluationChanges,
  mentorEvaluations,
  mentorGroupMentors,
} from "./schema";
import type { AddedGroup } from "./seed-mentor-groups";

type NewEvaluation = typeof mentorEvaluations.$inferInsert;

function idOf(ids: Map<string, string>, key: string, what: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`A sample evaluation names a ${what} that is missing.`);
  }
  return id;
}

function periodKey(period: Pick<SamplePeriod, "startYear" | "term">): string {
  return `${period.startYear} ${period.term}`;
}

async function periodIdsByKey(db: Database): Promise<Map<string, string>> {
  const periods = await db.select().from(academicPeriods);
  return new Map(periods.map((period) => [periodKey(period), period.id]));
}

/** The mentor of today of each group, by the id of the group. */
async function mentorIdsByGroup(
  db: Database,
  groupIds: string[],
): Promise<Map<string, string>> {
  const today = await db
    .select({
      groupId: mentorGroupMentors.groupId,
      mentorId: mentorGroupMentors.mentorId,
    })
    .from(mentorGroupMentors)
    .where(
      and(
        inArray(mentorGroupMentors.groupId, groupIds),
        isNull(mentorGroupMentors.endsOn),
      ),
    );
  return new Map(today.map((line) => [line.groupId, line.mentorId]));
}

/** The moment a sample evaluation was saved: the noon its period ended, or now. */
function savedAt(period: SamplePeriod, now: Date): Date {
  const end = new Date(`${period.endsOn}T12:00:00+07:00`);
  return end < now ? end : now;
}

async function addEvaluations(
  db: Database,
  evaluations: NewEvaluation[],
): Promise<void> {
  const added = await db
    .insert(mentorEvaluations)
    .values(evaluations)
    .returning();
  await db.insert(mentorEvaluationChanges).values(
    added.map((evaluation) => ({
      evaluationId: evaluation.id,
      changedBy: evaluation.evaluatedBy,
      changedAt: evaluation.evaluatedAt,
      activityAfter: evaluation.activity,
      attendanceAfter: evaluation.attendance,
      achievementAfter: evaluation.achievement,
      feedbackAfter: evaluation.feedback,
      noteAfter: evaluation.note,
    })),
  );
}

/**
 * Adds the sample evaluations of the mentors of the sample groups, each
 * with its first log line, as the work of the sample Kepala Unit. The
 * groups with their mentors and the sample periods must be there already.
 */
export async function addSampleMentorEvaluations(
  db: Database,
  groups: AddedGroup[],
  periods: SamplePeriod[],
  by: string,
): Promise<void> {
  const samples = groups.map((group) => group.sample);
  const evaluations = sampleMentorEvaluations(samples, periods);
  if (evaluations.length === 0) return;
  const groupIds = new Map(groups.map((group) => [group.sample, group.id]));
  const periodIds = await periodIdsByKey(db);
  const mentorIds = await mentorIdsByGroup(db, [...groupIds.values()]);
  const now = new Date();

  function newEvaluation(sample: SampleMentorEvaluation): NewEvaluation {
    const { group, period, ...values } = sample;
    const groupId = groupIds.get(group);
    if (groupId === undefined) {
      throw new Error("A sample evaluation names a group that is missing.");
    }
    return {
      ...values,
      groupId,
      mentorId: idOf(mentorIds, groupId, "Pengasuh"),
      periodId: idOf(periodIds, periodKey(period), "period"),
      evaluatedBy: by,
      evaluatedAt: savedAt(period, now),
    };
  }

  await addEvaluations(db, evaluations.map(newEvaluation));
}
