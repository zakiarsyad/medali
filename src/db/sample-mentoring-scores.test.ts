import { describe, expect, it } from "vitest";
import { finalScoreOf } from "@/mentoring/score-indicators";
import { isScore } from "@/mentoring/score-range";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";
import { sampleMentorGroups } from "./sample-mentor-groups";
import { sampleMentoringScores } from "./sample-mentoring-scores";
import { sampleGroupedFirstYears } from "./sample-new-intake";

const DAY = "2026-10-13";
const BEFORE_NEW_GROUPS = "2026-08-15";
const [period] = samplePeriods(DAY);
if (!period) throw new Error("There are no sample periods.");
const students = [...SAMPLE_STUDENTS, ...sampleGroupedFirstYears(2026)];
const groups = sampleMentorGroups(students, DAY);
const scores = sampleMentoringScores(groups, students, period, DAY);
const scoredNims = new Set(scores.map((score) => score.nim));

function activeMembersOf(group: (typeof groups)[number]): string[] {
  return group.memberNims.filter((nim) => {
    const student = students.find((each) => each.nim === nim);
    return (student?.status ?? "active") === "active";
  });
}

function scoredIn(group: (typeof groups)[number]): number {
  return activeMembersOf(group).filter((nim) => scoredNims.has(nim)).length;
}

describe("sampleMentoringScores", () => {
  it("scores a student once at most", () => {
    expect(scores.length).toBeGreaterThan(0);
    expect(scoredNims.size).toBe(scores.length);
  });

  it("gives most scores on six indicators, each final score the one of its six", () => {
    const onIndicators = scores.filter((score) => score.indicatorScores);
    expect(onIndicators.length).toBeGreaterThan(scores.length / 2);
    for (const { score, indicatorScores } of onIndicators) {
      expect(score).toBe(finalScoreOf(indicatorScores ?? []));
    }
  });

  it("keeps a score given before the indicators, a whole number from 0 to 100, in each group that is done", () => {
    const before = scores.filter((score) => score.indicatorScores === null);
    expect(before.length).toBeGreaterThan(0);
    for (const { score } of before) expect(isScore(score)).toBe(true);
  });

  it("scores only Aktif members of the sample groups", () => {
    const members = new Set(groups.flatMap(activeMembersOf));

    for (const nim of scoredNims) expect(members.has(nim)).toBe(true);
  });

  it("has a group that is done, a group under way and a group not begun", () => {
    const done = groups.filter(
      (group) => scoredIn(group) === activeMembersOf(group).length,
    );
    const notBegun = groups.filter((group) => scoredIn(group) === 0);
    const underWay = groups.filter((group) => {
      const scored = scoredIn(group);
      return scored > 0 && scored < activeMembersOf(group).length;
    });

    expect(done.length).toBeGreaterThan(0);
    expect(notBegun.length).toBeGreaterThan(0);
    expect(underWay.length).toBeGreaterThan(0);
  });

  it("has a score in each of the four bands of the rubric", () => {
    const values = scores.map((score) => score.score);

    expect(values.some((score) => score >= 85)).toBe(true);
    expect(values.some((score) => score >= 75 && score < 85)).toBe(true);
    expect(values.some((score) => score >= 65 && score < 75)).toBe(true);
    expect(values.some((score) => score < 65)).toBe(true);
  });

  it("is given inside the running period, today at the latest, by the mentor who held the group on that day", () => {
    for (const score of scores) {
      const group = groups.find((each) => each.memberNims.includes(score.nim));
      const holder = group?.mentors.find((mentor) => {
        const hasEnded =
          mentor.endsOn !== null && mentor.endsOn < score.scoredOn;
        return mentor.startsOn <= score.scoredOn && !hasEnded;
      });

      expect(score.scoredOn >= period.startsOn).toBe(true);
      expect(score.scoredOn <= DAY).toBe(true);
      expect(holder?.name).toBe(score.scoredBy);
    }
  });

  it("gives a group whose first mentor comes after today no score", () => {
    const early = sampleMentoringScores(
      groups,
      students,
      period,
      BEFORE_NEW_GROUPS,
    );
    const notStarted = groups
      .filter((group) => group.startsOn > BEFORE_NEW_GROUPS)
      .flatMap((group) => group.memberNims);

    expect(notStarted.length).toBeGreaterThan(0);
    for (const { nim } of early) expect(notStarted).not.toContain(nim);
  });
});
