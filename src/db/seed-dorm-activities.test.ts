// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { SAMPLE_ACCOUNTS } from "./sample-data";
import { sampleDormActivities } from "./sample-dorm-activities";
import {
  accounts,
  dormActivities,
  dormActivityDaysOff,
  dormActivityVersions,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample dorm activities", { timeout: 20_000 }, () => {
  it("are all added by the sample Kepala Unit, none removed, with their versions and days off", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const samples = sampleDormActivities(campusDay());
      const added = await db
        .select({ by: accounts.name, deletedAt: dormActivities.deletedAt })
        .from(dormActivities)
        .innerJoin(accounts, eq(accounts.id, dormActivities.changedBy));
      const versions = await db.select().from(dormActivityVersions);
      const daysOff = await db.select().from(dormActivityDaysOff);

      expect(samples.length).toBeGreaterThan(0);
      expect(added).toHaveLength(samples.length);
      for (const activity of added) {
        expect(activity.by).toBe(SAMPLE_ACCOUNTS[0]?.name);
        expect(activity.deletedAt).toBeNull();
      }
      expect(versions).toHaveLength(
        samples.reduce((sum, sample) => sum + sample.versions.length, 0),
      );
      expect(daysOff).toHaveLength(
        samples.reduce((sum, sample) => sum + sample.daysOff.length, 0),
      );
    });
  });
});
