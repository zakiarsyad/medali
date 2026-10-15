// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { violationStatus } from "@/features/dorm/violation-status";
import {
  accountRoles,
  accounts,
  dormViolationAppeals,
  dormViolationChanges,
  dormViolations,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample dorm violations", { timeout: 20_000 }, () => {
  it("are waiting, in Masa advokasi and gone up to Pengelola Asrama, recorded by the sample BAM", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const kept = await db.select().from(dormViolations);
      const roles = await db.select().from(accountRoles);
      const recorders = roles
        .filter(
          (each) => each.role === "bam_bphk" || each.role === "bam_compliance",
        )
        .map((each) => each.accountId);

      const shown = kept.filter((violation) => violation.cancelledAt === null);
      const statuses = new Set(
        shown.map((violation) => violationStatus(violation.announcedAt, now)),
      );
      expect([...statuses].sort()).toEqual([
        "appeal",
        "escalated",
        "scheduled",
      ]);
      for (const violation of kept) {
        expect(recorders).toContain(violation.enteredBy);
        expect(violation.enteredAt.getTime()).toBeLessThanOrEqual(
          now.getTime(),
        );
      }
    });
  });

  it("log every entry and the cancel", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const kept = await db.select().from(dormViolations);
      const lines = await db.select().from(dormViolationChanges);

      const cancelled = kept.filter((each) => each.cancelledAt !== null);
      expect(cancelled).toHaveLength(1);
      const entered = lines.filter((line) => line.action === "entered");
      const cancels = lines.filter((line) => line.action === "cancelled");
      expect(entered).toHaveLength(kept.length);
      expect(cancels.map((line) => line.violationId)).toEqual(
        cancelled.map((each) => each.id),
      );
    });
  });

  it("have appeals waiting, accepted and rejected, each sent by the resident's own account and logged with its decision", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const appeals = await db
        .select({
          violationId: dormViolationAppeals.violationId,
          status: dormViolationAppeals.status,
          decidedBy: dormViolationAppeals.decidedBy,
          studentId: dormViolations.studentId,
        })
        .from(dormViolationAppeals)
        .innerJoin(
          dormViolations,
          eq(dormViolations.id, dormViolationAppeals.violationId),
        );
      const lines = await db.select().from(dormViolationChanges);
      const owners = await db
        .select({ id: accounts.id, studentId: accounts.studentId })
        .from(accounts);

      expect(appeals.map((each) => each.status).sort()).toEqual([
        "accepted",
        "rejected",
        "waiting",
        "waiting",
      ]);
      for (const appeal of appeals) {
        const ofIt = lines.filter(
          (line) => line.violationId === appeal.violationId,
        );
        const sent = ofIt.find((line) => line.action === "appealed");
        const sender = owners.find((each) => each.id === sent?.changedBy);
        expect(sender?.studentId).toBe(appeal.studentId);
        const decisions = ofIt.filter((line) =>
          ["appeal_accepted", "appeal_rejected"].includes(line.action),
        );
        expect(decisions.map((line) => line.changedBy)).toEqual(
          appeal.decidedBy === null ? [] : [appeal.decidedBy],
        );
      }
    });
  });
});
