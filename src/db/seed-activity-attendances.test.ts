import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { sampleActivityAttendances } from "./sample-activity-attendances";
import { sampleActivitySchedules } from "./sample-activity-schedules";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";
import { accountRoles, activityAttendances } from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample attendance", { timeout: 20_000 }, () => {
  it("is all added, in every status, with no photo, and decided by Pegawai UPK unless it waits or an accepted clarification gave it", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const today = campusDay();
      const schedules = sampleActivitySchedules(today, samplePeriods(today));
      const samples = sampleActivityAttendances(
        schedules,
        SAMPLE_STUDENTS,
        today,
      );
      const added = await db.select().from(activityAttendances);
      const staff = await db
        .select({ id: accountRoles.accountId })
        .from(accountRoles)
        .where(eq(accountRoles.role, "upk_staff"));
      const staffIds = staff.map(({ id }) => id);

      // An accepted sample clarification changes a rejected attendance,
      // or records one where the student had sent nothing.
      const fromClarification = added.filter(({ note }) =>
        note.startsWith("Klarifikasi: "),
      );
      const recorded = fromClarification.filter(
        ({ sentAt }) => sentAt === null,
      );

      expect(samples.length).toBeGreaterThan(0);
      expect(added).toHaveLength(samples.length + recorded.length);
      expect(new Set(added.map(({ status }) => status)).size).toBe(4);
      for (const attendance of added) {
        expect(attendance.photoKey).toBeNull();
        if (attendance.status === "waiting") continue;
        if (fromClarification.includes(attendance)) continue;
        expect(staffIds).toContain(attendance.decidedBy);
      }
    });
  });
});
