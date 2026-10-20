// Sample Tahun akademik of this file: those of the app's sample data.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { isWeekday } from "@/academic-periods/weekdays";
import {
  isStudentScheduleStep,
  SAMPLE_SCHEDULES,
} from "./sample-counselling-schedules";
import {
  accounts,
  counsellingScheduleChanges,
  counsellingSchedules,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample requests for counselling", { timeout: 20_000 }, () => {
  it("are added in their last status on a coming weekday, each with a log line per step, made before now", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();
      const today = campusDay(now);

      const schedules = await db
        .select({
          id: counsellingSchedules.id,
          nim: students.nim,
          status: counsellingSchedules.status,
          day: counsellingSchedules.day,
          counsellorId: counsellingSchedules.counsellorId,
          changedAt: counsellingSchedules.changedAt,
        })
        .from(counsellingSchedules)
        .innerJoin(students, eq(students.id, counsellingSchedules.studentId));
      const lines = await db
        .select({
          scheduleId: counsellingScheduleChanges.scheduleId,
          step: counsellingScheduleChanges.step,
          statusBefore: counsellingScheduleChanges.statusBefore,
          by: accounts.studentId,
        })
        .from(counsellingScheduleChanges)
        .innerJoin(
          accounts,
          eq(accounts.id, counsellingScheduleChanges.changedBy),
        )
        .orderBy(asc(counsellingScheduleChanges.changedAt));

      expect(schedules).toHaveLength(SAMPLE_SCHEDULES.length);
      for (const sample of SAMPLE_SCHEDULES) {
        const schedule = schedules.find((each) => each.nim === sample.nim);
        expect(schedule?.status).toBe(sample.steps.at(-1)?.statusAfter);
        expect(isWeekday(schedule?.day ?? "")).toBe(true);
        expect((schedule?.day ?? "") > today).toBe(true);
        expect(schedule?.changedAt.getTime()).toBeLessThanOrEqual(
          now.getTime(),
        );
        const own = lines.filter((line) => line.scheduleId === schedule?.id);
        expect(own.map((line) => line.step)).toEqual(
          sample.steps.map((step) => step.step),
        );
        expect(own[0]?.statusBefore).toBeNull();
        expect(own.map((line) => line.by !== null)).toEqual(
          sample.steps.map((step) => isStudentScheduleStep(step.step)),
        );
        const proposedOrApproved = own.some((line) => line.by === null);
        expect(schedule?.counsellorId !== null).toBe(proposedOrApproved);
      }
    });
  });
});
