// Sample Tahun akademik of this file: those of the app's sample data.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { WITHDRAWN_NOTE } from "@/features/dorm/clarification-words";
import type { Database } from "./connect";
import {
  accountRoles,
  dormAttendanceMarks,
  dormClarificationChanges,
  dormClarifications,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

async function sampleAccountOf(
  db: Database,
  role: "bam_bphk" | "dorm_manager",
) {
  const [found] = await db
    .select({ id: accountRoles.accountId })
    .from(accountRoles)
    .where(eq(accountRoles.role, role));
  return found?.id;
}

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample dorm clarifications", { timeout: 20_000 }, () => {
  it("are in every status, with the drawn paper not kept yet, checked by the sample BAM - BPHK and decided by the sample Pengelola Asrama, each with its log lines", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const bam = await sampleAccountOf(db, "bam_bphk");
      const manager = await sampleAccountOf(db, "dorm_manager");
      const added = await db.select().from(dormClarifications);
      const log = await db.select().from(dormClarificationChanges);
      const marks = await db.select().from(dormAttendanceMarks);

      expect(new Set(added.map((each) => each.status))).toEqual(
        new Set(["submitted", "verified", "accepted", "rejected", "closed"]),
      );
      for (const each of added) {
        expect(each.fileKey).toBeNull();
        expect(each.fileName).toBe("surat-keterangan.pdf");
        expect(each.fileContentType).toBe("application/pdf");
        if (each.verifiedBy !== null) expect(each.verifiedBy).toBe(bam);
        const lines = log.filter((line) => line.clarificationId === each.id);
        const mark = marks.find(
          (row) =>
            row.countId === each.countId && row.studentId === each.studentId,
        );
        if (each.status === "closed") {
          expect(each.decidedBy).toBe(bam);
          expect(each.decisionNote).toBe(WITHDRAWN_NOTE);
          expect(mark?.isAbsent).toBe(false);
          expect(lines).toHaveLength(1);
          continue;
        }
        expect(mark?.isAbsent).toBe(true);
        if (each.decidedBy !== null) expect(each.decidedBy).toBe(manager);
        const checks = [each.verifiedAt, each.decidedAt].filter(Boolean);
        expect(lines).toHaveLength(checks.length);
        expect(lines.at(-1)?.statusAfter ?? "submitted").toBe(each.status);
      }
    });
  });
});
