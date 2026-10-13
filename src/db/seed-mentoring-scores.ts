import type { Database } from "./connect";
import type { SamplePeriod } from "./sample-data";
import { sampleMentoringScores } from "./sample-mentoring-scores";
import type { SampleStudent } from "./sample-students";
import { mentoringScoreChanges, mentoringScores } from "./schema";
import {
  type AddedGroup,
  mentorIdsByName,
  studentIdsByNim,
} from "./seed-mentor-groups";
import { periodIdOf } from "./seed-mentoring-meetings";

function idOf(ids: Map<string, string>, key: string, what: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(
      `A sample mentoring score names a ${what} that is missing.`,
    );
  }
  return id;
}

/** The moment a sample score was saved: the afternoon of its day, or now. */
function scoredAt(scoredOn: string, now: Date): Date {
  const afternoon = new Date(`${scoredOn}T16:00:00+07:00`);
  return afternoon < now ? afternoon : now;
}

/**
 * Adds the sample scores of the running period for part of the sample
 * groups, each with its first log line, as the work of the sample Pengasuh
 * who held the group on its day. The groups with their members and
 * mentors and the sample periods must be there already. `day` is today on
 * campus.
 */
export async function addSampleMentoringScores(
  db: Database,
  groups: AddedGroup[],
  students: SampleStudent[],
  period: SamplePeriod,
  day: string,
): Promise<void> {
  const samples = groups.map((group) => group.sample);
  const scores = sampleMentoringScores(samples, students, period, day);
  if (scores.length === 0) return;
  const studentIds = await studentIdsByNim(db);
  const mentorIds = await mentorIdsByName(db, samples);
  const periodId = await periodIdOf(db, period);
  const now = new Date();

  const added = await db
    .insert(mentoringScores)
    .values(
      scores.map((sample) => ({
        studentId: idOf(studentIds, sample.nim, "student"),
        periodId,
        score: sample.score,
        scoredBy: idOf(mentorIds, sample.scoredBy, "Pengasuh"),
        scoredAt: scoredAt(sample.scoredOn, now),
      })),
    )
    .returning();
  await db.insert(mentoringScoreChanges).values(
    added.map((score) => ({
      scoreId: score.id,
      changedBy: score.scoredBy,
      changedAt: score.scoredAt,
      scoreAfter: score.score,
    })),
  );
}
