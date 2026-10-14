// Sample Tahun akademik of this file: those of the app's sample data.
import { eq, isNotNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { sampleDormLeaves } from "./sample-dorm-leaves";
import { accountRoles, dormLeaves } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample dorm leave requests", { timeout: 20_000 }, () => {
  it("are all added, sent before now, with every decision made by the sample Pengelola Asrama", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const [manager] = await db
        .select({ id: accountRoles.accountId })
        .from(accountRoles)
        .where(eq(accountRoles.role, "dorm_manager"));
      const kept = await db.select().from(dormLeaves);
      const decided = await db
        .select()
        .from(dormLeaves)
        .where(isNotNull(dormLeaves.decidedBy));

      expect(kept).toHaveLength(sampleDormLeaves("2026-10-14").length);
      for (const leave of kept) {
        expect(leave.sentAt.getTime()).toBeLessThanOrEqual(now.getTime());
      }
      expect(decided.length).toBeGreaterThan(0);
      for (const leave of decided) {
        expect(leave.decidedBy).toBe(manager?.id);
        expect(leave.decidedAt?.getTime()).toBeLessThanOrEqual(now.getTime());
      }
    });
  });
});
