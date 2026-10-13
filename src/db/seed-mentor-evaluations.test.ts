import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { evaluationResult } from "@/features/mentor-groups/evaluation-result";
import { SAMPLE_ACCOUNTS } from "./sample-data";
import {
  accounts,
  mentorEvaluationChanges,
  mentorEvaluations,
  mentorGroupMentors,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample mentor evaluations", { timeout: 20_000 }, () => {
  it("are by the sample Kepala Unit, of a mentor of the group, with Baik and Kurang among them and a first log line each", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const evaluations = await db
        .select({
          evaluation: mentorEvaluations,
          evaluator: accounts.name,
        })
        .from(mentorEvaluations)
        .innerJoin(accounts, eq(accounts.id, mentorEvaluations.evaluatedBy));
      const lines = await db.select().from(mentorEvaluationChanges);
      const held = await db.select().from(mentorGroupMentors);

      expect(evaluations.length).toBeGreaterThanOrEqual(3);
      const results = evaluations.map((row) =>
        evaluationResult(row.evaluation),
      );
      expect(results).toContain("good");
      expect(results).toContain("poor");
      for (const { evaluation, evaluator } of evaluations) {
        expect(evaluator).toBe(SAMPLE_ACCOUNTS[0]?.name);
        const holds = held.some(
          (line) =>
            line.groupId === evaluation.groupId &&
            line.mentorId === evaluation.mentorId,
        );
        expect(holds).toBe(true);
        const ofThis = lines.filter(
          (line) => line.evaluationId === evaluation.id,
        );
        expect(ofThis).toHaveLength(1);
        expect(ofThis[0]).toMatchObject({
          activityBefore: null,
          activityAfter: evaluation.activity,
        });
      }
    });
  });
});
