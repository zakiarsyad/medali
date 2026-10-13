import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { sampleActivityAttendances } from "./sample-activity-attendances";
import { sampleClarifications } from "./sample-activity-clarifications";
import { sampleActivitySchedules } from "./sample-activity-schedules";
import { SAMPLE_STUDENTS, samplePeriods } from "./sample-data";
import {
  accountRoles,
  activityAttendanceChanges,
  activityAttendances,
  activityClarificationChanges,
  activityClarifications,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

function samplesToday() {
  const today = campusDay();
  const schedules = sampleActivitySchedules(today, samplePeriods(today));
  const attendances = sampleActivityAttendances(
    schedules,
    SAMPLE_STUDENTS,
    today,
  );
  return sampleClarifications(schedules, SAMPLE_STUDENTS, attendances, today);
}

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample clarifications", { timeout: 20_000 }, () => {
  it("are all added, in every status, without a file yet, and decided by Penilai Mahasiswa unless they wait", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const samples = samplesToday();
      const added = await db.select().from(activityClarifications);
      const assessors = await db
        .select({ id: accountRoles.accountId })
        .from(accountRoles)
        .where(eq(accountRoles.role, "assessor"));
      const assessorIds = assessors.map(({ id }) => id);

      expect(samples.length).toBeGreaterThan(0);
      expect(added).toHaveLength(samples.length);
      expect(new Set(added.map(({ status }) => status)).size).toBe(3);
      for (const clarification of added) {
        expect(clarification.fileKey).toBeNull();
        expect(clarification.fileName).toBe("surat-keterangan.pdf");
        expect(clarification.fileContentType).toBe("application/pdf");
        expect(clarification.fileSize).toBeGreaterThan(0);
        if (clarification.status === "submitted") continue;
        expect(assessorIds).toContain(clarification.decidedBy);
      }
    });
  });

  it("have a line in the log for every decision", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const decided = (await db.select().from(activityClarifications)).filter(
        ({ status }) => status !== "submitted",
      );
      const lines = await db.select().from(activityClarificationChanges);

      expect(lines).toHaveLength(decided.length);
      for (const clarification of decided) {
        const line = lines.find(
          ({ clarificationId }) => clarificationId === clarification.id,
        );
        expect(line).toMatchObject({
          changedBy: clarification.decidedBy,
          changedAt: clarification.decidedAt,
          statusBefore: "submitted",
          statusAfter: clarification.status,
          acceptedAs: clarification.acceptedAs,
          note: clarification.note,
        });
      }
    });
  });

  it("give each accepted one its attendance, Hadir or Dispensasi, with the Keterangan of a clarification and a line in the log of attendance decisions", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const clarifications = await db.select().from(activityClarifications);
      const accepted = clarifications.filter(
        ({ status }) => status === "accepted",
      );
      const attendances = await db.select().from(activityAttendances);
      const lines = await db.select().from(activityAttendanceChanges);

      expect(accepted.length).toBeGreaterThan(1);
      expect(lines).toHaveLength(accepted.length);
      for (const clarification of accepted) {
        const own = attendances.filter(
          (each) =>
            each.studentId === clarification.studentId &&
            each.scheduleId === clarification.scheduleId,
        );
        expect(own).toHaveLength(1);
        expect(own[0]).toMatchObject({
          status: clarification.acceptedAs,
          decidedAt: clarification.decidedAt,
          decidedBy: clarification.decidedBy,
        });
        expect(own[0]?.note).toMatch(/^Klarifikasi: \S/);
        const line = lines.find(
          ({ attendanceId }) => attendanceId === own[0]?.id,
        );
        expect(line).toMatchObject({
          statusAfter: clarification.acceptedAs,
          noteAfter: own[0]?.note,
          changedBy: clarification.decidedBy,
        });
        // With nothing sent there was nothing before; a photo had been rejected.
        expect([null, "rejected"]).toContain(line?.statusBefore);
        expect(line?.statusBefore === null).toBe(own[0]?.sentAt === null);
      }
    });
  });

  it("leave the attendance of a waiting or rejected one as it was: none, or a rejected photo", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const clarifications = await db.select().from(activityClarifications);
      const attendances = await db.select().from(activityAttendances);
      const notAccepted = clarifications.filter(
        ({ status }) => status !== "accepted",
      );

      expect(notAccepted.length).toBeGreaterThan(1);
      for (const clarification of notAccepted) {
        const own = attendances.filter(
          (each) =>
            each.studentId === clarification.studentId &&
            each.scheduleId === clarification.scheduleId,
        );
        expect(own.every(({ status }) => status === "rejected")).toBe(true);
      }
    });
  });
});
