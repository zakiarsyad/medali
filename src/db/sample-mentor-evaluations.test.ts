import { describe, expect, it } from "vitest";
import { heldDuring } from "@/features/mentor-groups/evaluation-periods";
import { evaluationResult } from "@/features/mentor-groups/evaluation-result";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";
import { sampleMentorEvaluations } from "./sample-mentor-evaluations";
import { sampleMentorGroups } from "./sample-mentor-groups";
import { sampleGroupedFirstYears } from "./sample-new-intake";

const DAY = "2026-10-13";
const periods = samplePeriods(DAY);
const groups = sampleMentorGroups([
  ...SAMPLE_STUDENTS,
  ...sampleGroupedFirstYears(2026),
]);
const evaluations = sampleMentorEvaluations(groups, periods);

describe("sampleMentorEvaluations", () => {
  it("has at least one Baik, one Cukup and one Kurang", () => {
    const results = evaluations.map(evaluationResult);

    expect(results).toContain("good");
    expect(results).toContain("fair");
    expect(results).toContain("poor");
  });

  it("evaluates only sample groups, of an angkatan before the running period", () => {
    for (const evaluation of evaluations) {
      expect(groups).toContain(evaluation.group);
      expect(evaluation.group.cohortYear).toBeLessThan(2026);
    }
  });

  it("uses only the running period and the one before", () => {
    for (const evaluation of evaluations) {
      expect(periods.slice(0, 2)).toContain(evaluation.period);
    }
  });

  it("evaluates no group twice for one period, and one group for both", () => {
    const keys = evaluations.map(
      ({ group, period }) => `${groups.indexOf(group)} ${period.startsOn}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    const first = evaluations.filter(
      (evaluation) => evaluation.group === evaluations[0]?.group,
    );
    expect(first).toHaveLength(2);
  });

  it("keeps every value within 0 to 100", () => {
    for (const evaluation of evaluations) {
      const { activity, attendance, achievement, feedback } = evaluation;
      for (const value of [activity, attendance, achievement, feedback]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("evaluates a mentor only for a period they held the group in", () => {
    for (const { group, period } of evaluations) {
      const since = group.mentors.at(-1)?.startsOn ?? "";

      expect(since).not.toBe("");
      expect(heldDuring(period, since)).toBe(true);
    }
  });

  it("is empty without a period before the running one", () => {
    expect(sampleMentorEvaluations(groups, periods.slice(0, 1))).toEqual([]);
  });
});
