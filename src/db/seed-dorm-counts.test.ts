// Sample Tahun akademik of this file: those of the app's sample data.
import { eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import {
  accountRoles,
  dormAttendanceChanges,
  dormAttendanceCounts,
  dormAttendanceMarks,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample dorm counts", { timeout: 20_000 }, () => {
  it("are of the week before today, made by the sample BAM - BPHK, with marks and a log line for each announcement", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const today = campusDay();
      const [counter] = await db
        .select({ id: accountRoles.accountId })
        .from(accountRoles)
        .where(eq(accountRoles.role, "bam_bphk"));
      const counts = await db.select().from(dormAttendanceCounts);
      const drafts = await db
        .select()
        .from(dormAttendanceCounts)
        .where(isNull(dormAttendanceCounts.announcedAt));
      const marks = await db.select().from(dormAttendanceMarks);
      const log = await db.select().from(dormAttendanceChanges);

      expect(counts.length).toBeGreaterThan(0);
      for (const count of counts) {
        expect(count.savedBy).toBe(counter?.id);
        expect(count.day >= daysAfter(today, -7)).toBe(true);
        expect(count.day < today).toBe(true);
      }
      expect(drafts).toHaveLength(1);
      expect(marks.some((mark) => mark.isAbsent)).toBe(true);
      // One line for each announced count, and one more for the corrected one.
      expect(log).toHaveLength(counts.length - drafts.length + 1);
    });
  });
});
