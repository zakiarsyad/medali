// Sample Tahun akademik of this file: those of the app's sample data.
import { isNotNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { SAMPLE_SIKU_ENTRIES } from "./sample-siku-adjustments";
import {
  academicPeriods,
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample SIKU entries", { timeout: 20_000 }, () => {
  it("are all added with their students and log lines, entered before now, in more than one period", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const kept = await db.select().from(sikuAdjustments);
      const named = await db.select().from(sikuAdjustmentStudents);
      const lines = await db.select().from(sikuAdjustmentChanges);
      const cancelled = await db
        .select()
        .from(sikuAdjustments)
        .where(isNotNull(sikuAdjustments.cancelledAt));
      const periods = await db.select().from(academicPeriods);

      expect(kept).toHaveLength(SAMPLE_SIKU_ENTRIES.length);
      const nims = SAMPLE_SIKU_ENTRIES.flatMap((entry) => entry.nims);
      expect(named).toHaveLength(nims.length);
      expect(lines).toHaveLength(kept.length + cancelled.length);
      expect(cancelled).toHaveLength(1);
      for (const entry of kept) {
        expect(entry.enteredAt.getTime()).toBeLessThanOrEqual(now.getTime());
      }
      const usedPeriods = new Set(kept.map((entry) => entry.periodId));
      expect(usedPeriods.size).toBeGreaterThan(1);
      expect(periods.length).toBeGreaterThan(1);
    });
  });
});
