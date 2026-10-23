import { inArray } from "drizzle-orm";
import type { Database } from "./connect";
import type { SampleStudent } from "./sample-students";
import {
  type SampleSurveyAnswer,
  sampleSurveyAnswers,
} from "./sample-survey-answers";
import { mentorGroupMentors, studentSurveyAnswers } from "./schema";
import { type AddedGroup, studentIdsByNim } from "./seed-mentor-groups";
import { type AddedSurveyPeriod, noonOf } from "./seed-survey-periods";

type MentorLine = Pick<
  typeof mentorGroupMentors.$inferSelect,
  "groupId" | "mentorId" | "startsOn" | "endsOn"
>;

function idOf<Key>(ids: Map<Key, string>, key: Key, what: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`A sample survey answer names a ${what} that is missing.`);
  }
  return id;
}

/** Whether a mentor line held its group on a day. */
function heldOn(line: MentorLine, day: string): boolean {
  if (line.startsOn > day) return false;
  return line.endsOn === null || line.endsOn > day;
}

/** The mentor who held a group on a day, as the form named them then. */
function mentorOn(lines: MentorLine[], groupId: string, day: string): string {
  const line = lines.find((one) => one.groupId === groupId && heldOn(one, day));
  if (!line) throw new Error("A sample survey answer has no mentor that day.");
  return line.mentorId;
}

/**
 * Adds the sample answers of the sample survey periods, each for the
 * group of its student and the mentor who held the group on the day it
 * was sent. The students, the groups with their mentors and the survey
 * periods must be there already.
 */
export async function addSampleSurveyAnswers(
  db: Database,
  surveys: AddedSurveyPeriod[],
  groups: AddedGroup[],
  students: SampleStudent[],
): Promise<void> {
  const samples = groups.map((group) => group.sample);
  const surveySamples = surveys.map((survey) => survey.sample);
  const answers = sampleSurveyAnswers(surveySamples, samples, students);
  if (answers.length === 0) return;
  const surveyIds = new Map(surveys.map((one) => [one.sample, one.id]));
  const groupIds = new Map(groups.map((one) => [one.sample, one.id]));
  const studentIds = await studentIdsByNim(db);
  const lines = await db
    .select()
    .from(mentorGroupMentors)
    .where(inArray(mentorGroupMentors.groupId, [...groupIds.values()]));

  function newAnswer(answer: SampleSurveyAnswer) {
    const groupId = idOf(groupIds, answer.group, "group");
    return {
      surveyPeriodId: idOf(surveyIds, answer.survey, "survey period"),
      studentId: idOf(studentIds, answer.nim, "student"),
      groupId,
      mentorId: mentorOn(lines, groupId, answer.sentOn),
      scores: answer.scores,
      suggestion: answer.suggestion,
      sentAt: noonOf(answer.sentOn),
    };
  }

  await db.insert(studentSurveyAnswers).values(answers.map(newAnswer));
}
