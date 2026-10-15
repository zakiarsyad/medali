// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SAMPLE_FITNESS_TESTS } from "./sample-fitness-scores";
import { fitnessScores, fitnessTests, mentorGroupMembers } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample fitness scores", { timeout: 20_000 }, () => {
  it("are all added before now, each save for a group that holds its students", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const tests = await db.select().from(fitnessTests);
      const scores = await db
        .select({
          testId: fitnessScores.testId,
          inGroup: mentorGroupMembers.groupId,
        })
        .from(fitnessScores)
        .innerJoin(fitnessTests, eq(fitnessTests.id, fitnessScores.testId))
        .leftJoin(
          mentorGroupMembers,
          eq(mentorGroupMembers.studentId, fitnessScores.studentId),
        );

      expect(tests).toHaveLength(SAMPLE_FITNESS_TESTS.length);
      const sampleScores = SAMPLE_FITNESS_TESTS.flatMap((test) => test.scores);
      expect(scores).toHaveLength(sampleScores.length);
      const groupOfTest = new Map(tests.map((test) => [test.id, test.groupId]));
      for (const score of scores) {
        expect(score.inGroup).toBe(groupOfTest.get(score.testId));
      }
      for (const test of tests) {
        expect(test.enteredAt.getTime()).toBeLessThanOrEqual(now.getTime());
      }
    });
  });
});
