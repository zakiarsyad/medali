import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import type { Database } from "./connect";
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

type Clarification = typeof activityClarifications.$inferSelect;
type Attendance = typeof activityAttendances.$inferSelect;

async function assessorIds(db: Database): Promise<string[]> {
  const assessors = await db
    .select({ id: accountRoles.accountId })
    .from(accountRoles)
    .where(eq(accountRoles.role, "assessor"));
  return assessors.map(({ id }) => id);
}

function attendancesOf(
  attendances: Attendance[],
  clarification: Clarification,
): Attendance[] {
  return attendances.filter(
    (each) =>
      each.studentId === clarification.studentId &&
      each.scheduleId === clarification.scheduleId,
  );
}

/*
 * One load of the sample set for every check here: loading it takes
 * seconds when every check runs at once, and each load waits behind the
 * other checks that write the same tables.
 */
describe("the sample clarifications", { timeout: 20_000 }, () => {
  it("are all added in every status without a file yet, decided by Penilai Mahasiswa unless they wait, each decision in the log, and each accepted one with the attendance it gives", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const samples = samplesToday();
      const added = await db.select().from(activityClarifications);
      const deciders = await assessorIds(db);
      const lines = await db.select().from(activityClarificationChanges);
      const attendances = await db.select().from(activityAttendances);
      const attendanceLines = await db.select().from(activityAttendanceChanges);
      const decided = added.filter(({ status }) => status !== "submitted");
      const accepted = added.filter(({ status }) => status === "accepted");

      expect(samples.length).toBeGreaterThan(0);
      expect(added).toHaveLength(samples.length);
      expect(new Set(added.map(({ status }) => status)).size).toBe(3);
      for (const clarification of added) {
        expect(clarification.fileKey).toBeNull();
        expect(clarification.fileName).toBe("surat-keterangan.pdf");
        expect(clarification.fileContentType).toBe("application/pdf");
        expect(clarification.fileSize).toBeGreaterThan(0);
        if (clarification.status === "submitted") continue;
        expect(deciders).toContain(clarification.decidedBy);
      }

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

      expect(accepted.length).toBeGreaterThan(1);
      expect(attendanceLines).toHaveLength(accepted.length);
      for (const clarification of added) {
        const own = attendancesOf(attendances, clarification);
        if (clarification.status !== "accepted") {
          // Left as it was: nothing sent, or a rejected photo.
          expect(own.every(({ status }) => status === "rejected")).toBe(true);
          continue;
        }
        expect(own).toHaveLength(1);
        expect(own[0]).toMatchObject({
          status: clarification.acceptedAs,
          decidedAt: clarification.decidedAt,
          decidedBy: clarification.decidedBy,
        });
        expect(own[0]?.note).toMatch(/^Klarifikasi: \S/);
        const line = attendanceLines.find(
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
});
