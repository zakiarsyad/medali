// Sample Tahun akademik of this file: those of the app's sample data.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SAMPLE_SHARINGS } from "./sample-counselling-sharings";
import {
  counsellingSharingChanges,
  counsellingSharings,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample sharings of counselling data", { timeout: 20_000 }, () => {
  it("are added as they are written, each with a log line for every step, and none after now", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const sharings = await db
        .select({
          id: counsellingSharings.id,
          nim: students.nim,
          status: counsellingSharings.status,
          summary: counsellingSharings.summary,
          recipients: counsellingSharings.recipients,
          way: counsellingSharings.way,
          publishedAt: counsellingSharings.publishedAt,
          askedAt: counsellingSharings.askedAt,
          changedAt: counsellingSharings.changedAt,
        })
        .from(counsellingSharings)
        .innerJoin(students, eq(students.id, counsellingSharings.studentId))
        .orderBy(asc(counsellingSharings.askedAt));
      const lines = await db
        .select()
        .from(counsellingSharingChanges)
        .orderBy(asc(counsellingSharingChanges.changedAt));

      expect(sharings).toHaveLength(SAMPLE_SHARINGS.length);
      expect(lines).toHaveLength(
        SAMPLE_SHARINGS.reduce((sum, sample) => sum + sample.steps.length, 0),
      );
      for (const sharing of sharings) {
        expect(sharing.changedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        const own = lines.filter((line) => line.sharingId === sharing.id);
        expect(own[0]?.step).toBe("ask");
        expect(own[0]?.statusBefore).toBeNull();
        expect(own.at(-1)?.statusAfter).toBe(sharing.status);
        expect(own.at(-1)?.changedAt).toEqual(sharing.changedAt);
        for (const line of own) {
          expect(line.shared.recipients).toEqual(sharing.recipients);
          expect(line.shared.summary).toBe(sharing.summary);
        }
      }

      const dimas = sharings.find((each) => each.nim === "9900240004");
      expect(dimas).toMatchObject({ status: "approved", way: "paper" });
      const bayu = sharings.filter((each) => each.nim === "9900240002");
      expect(bayu.map((each) => each.status)).toEqual([
        "declined",
        "published",
      ]);
      expect(bayu[1]?.publishedAt).not.toBeNull();
    });
  });
});
