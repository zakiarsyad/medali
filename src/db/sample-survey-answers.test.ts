import { describe, expect, it } from "vitest";
import { surveyGroupResult } from "@/features/mentor-groups/survey-result";
import {
  HIGHEST_SCORE,
  LOWEST_SCORE,
  SUGGESTION_MAX,
  SURVEY_STATEMENTS,
} from "@/mentoring/survey-statements";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";
import {
  isGroupOf,
  SAMPLE_REPLACED_GROUP,
  sampleMentorGroups,
} from "./sample-mentor-groups";
import { sampleGroupedFirstYears } from "./sample-new-intake";
import { sampleSurveyAnswers } from "./sample-survey-answers";
import { sampleSurveyPeriods } from "./sample-survey-periods";

const DAY = "2026-10-13";
const students = [...SAMPLE_STUDENTS, ...sampleGroupedFirstYears(2026)];
const groups = sampleMentorGroups(students, DAY);
const surveys = sampleSurveyPeriods(samplePeriods(DAY));
const answers = sampleSurveyAnswers(surveys, groups, students);

function answersOf(group: (typeof groups)[number]) {
  return answers.filter((answer) => answer.group === group);
}

describe("sampleSurveyAnswers", () => {
  it("answers the one sample survey period", () => {
    expect(surveys).toHaveLength(1);
    expect(answers.length).toBeGreaterThan(0);
    for (const answer of answers) expect(answer.survey).toBe(surveys[0]);
  });

  it("is sent only by Aktif members of a group that had started by the first day, once each", () => {
    const status = new Map(students.map((s) => [s.nim, s.status ?? "active"]));
    for (const answer of answers) {
      expect(answer.group.memberNims).toContain(answer.nim);
      expect(status.get(answer.nim)).toBe("active");
      expect(answer.group.startsOn <= answer.survey.startsOn).toBe(true);
    }
    const nims = answers.map((answer) => answer.nim);
    expect(new Set(nims).size).toBe(nims.length);
  });

  it("is sent within the dates of the period", () => {
    for (const { sentOn, survey } of answers) {
      expect(sentOn >= survey.startsOn).toBe(true);
      expect(sentOn <= survey.endsOn).toBe(true);
    }
  });

  it("gives each statement a score of 1 to 5, and suggestions of the allowed length only", () => {
    for (const { scores, suggestion } of answers) {
      expect(scores).toHaveLength(SURVEY_STATEMENTS.length);
      for (const score of scores) {
        expect(score).toBeGreaterThanOrEqual(LOWEST_SCORE);
        expect(score).toBeLessThanOrEqual(HIGHEST_SCORE);
      }
      if (suggestion !== null) {
        expect(suggestion.trim()).toBe(suggestion);
        expect(suggestion.length).toBeLessThanOrEqual(SUGGESTION_MAX);
      }
    }
    expect(answers.some((answer) => answer.suggestion !== null)).toBe(true);
    expect(answers.some((answer) => answer.suggestion === null)).toBe(true);
  });

  it("has a group with 3 answers or more, one with 1 or 2, and a started one with none", () => {
    const started = groups.filter(
      (g) => g.startsOn <= (surveys[0]?.startsOn ?? ""),
    );
    const counts = started.map((group) => answersOf(group).length);

    expect(counts.some((count) => count >= 3)).toBe(true);
    expect(counts.some((count) => count === 1 || count === 2)).toBe(true);
    expect(counts).toContain(0);
  });

  it("makes the result of the group of the earlier replacement Kurang beside its Capaian karakter on the closing day", () => {
    const low = groups.find((group) => isGroupOf(group, SAMPLE_REPLACED_GROUP));
    if (!low) throw new Error("The sample replaced group is missing.");
    const own = answersOf(low);
    let total = 0;
    for (const { scores } of own) for (const score of scores) total += score;

    expect(own.length).toBeGreaterThanOrEqual(3);
    // The one member assessed by then has a Rerata of 74,2.
    const result = surveyGroupResult(
      { answers: own.length, total, members: own.length, achievement: 74.2 },
      50,
    );
    expect(result.result).toBe("poor");
  });

  it("is empty without a survey period", () => {
    expect(sampleSurveyAnswers([], groups, students)).toEqual([]);
  });
});
