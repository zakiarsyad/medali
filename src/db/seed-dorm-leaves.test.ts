// Sample Tahun akademik of this file: those of the app's sample data.
import { eq, isNotNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { sampleDormLeaves, sampleReturns } from "./sample-dorm-leaves";
import { accountRoles, dormLeaves, dormReturnReports } from "./schema";
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

      const sampleCount =
        sampleDormLeaves("2026-10-14").length + sampleReturns(now).length;
      expect(kept).toHaveLength(sampleCount);
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

  it("have reports of a return checked by the sample BAM - BPHK and Pengelola Asrama, with no photo until the sample photos command", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const roles = await db
        .select({ id: accountRoles.accountId, role: accountRoles.role })
        .from(accountRoles);
      const bam = roles.find((each) => each.role === "bam_bphk");
      const manager = roles.find((each) => each.role === "dorm_manager");
      const reports = await db.select().from(dormReturnReports);

      expect(reports.length).toBeGreaterThan(0);
      for (const report of reports) {
        expect(report.photoKey).toBeNull();
        expect(report.sentAt.getTime()).toBeLessThanOrEqual(now.getTime());
        if (report.verifiedBy !== null) expect(report.verifiedBy).toBe(bam?.id);
        if (report.validatedBy !== null) {
          expect(report.validatedBy).toBe(manager?.id);
        }
      }
    });
  });
});
