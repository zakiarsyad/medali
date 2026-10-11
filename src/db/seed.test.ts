import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  SAMPLE_ACCOUNTS,
  SAMPLE_PPKS_ACTIVITIES,
  SAMPLE_STUDENTS,
} from "./sample-data";
import { accounts, ppksActivities, students } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

describe("fillWithSampleData", () => {
  it("adds every sample student", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const added = await db.select({ nim: students.nim }).from(students);
      expect(added.map((student) => student.nim).sort()).toEqual(
        SAMPLE_STUDENTS.map((student) => student.nim).sort(),
      );
    });
  });

  it("adds the sample PPKS activities, changed by the sample Kepala Unit", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const added = await db
        .select({ name: ppksActivities.name, by: accounts.name })
        .from(ppksActivities)
        .innerJoin(accounts, eq(accounts.id, ppksActivities.changedBy));
      expect(added.map((activity) => activity.name).sort()).toEqual(
        SAMPLE_PPKS_ACTIVITIES.map((activity) => activity.name).sort(),
      );
      for (const activity of added) {
        expect(activity.by).toBe(SAMPLE_ACCOUNTS[0]?.name);
      }
    });
  });
});
