// Sample Tahun akademik of this file: those of the app's sample data.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { isWeekday } from "@/academic-periods/weekdays";
import {
  isStudentScheduleStep,
  SAMPLE_ASSIGNMENTS,
  SAMPLE_SCHEDULES,
} from "./sample-counselling-schedules";
import {
  accounts,
  counsellingScheduleChanges,
  counsellingSchedules,
  disciplinePenalties,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { sampleAccountOf } from "./seed-siku-adjustments";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample requests for counselling", { timeout: 20_000 }, () => {
  it("are added in their last status on a weekday, coming while active, each with a log line per step, made before now", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();
      const today = campusDay(now);

      const schedules = await db
        .select({
          id: counsellingSchedules.id,
          nim: students.nim,
          kind: counsellingSchedules.kind,
          status: counsellingSchedules.status,
          day: counsellingSchedules.day,
          counsellorId: counsellingSchedules.counsellorId,
          basis: counsellingSchedules.basis,
          changedAt: counsellingSchedules.changedAt,
          penaltyId: counsellingSchedules.penaltyId,
          penaltyOf: disciplinePenalties.studentId,
          studentId: counsellingSchedules.studentId,
        })
        .from(counsellingSchedules)
        .innerJoin(students, eq(students.id, counsellingSchedules.studentId))
        .leftJoin(
          disciplinePenalties,
          eq(disciplinePenalties.id, counsellingSchedules.penaltyId),
        );
      const lines = await db
        .select({
          scheduleId: counsellingScheduleChanges.scheduleId,
          step: counsellingScheduleChanges.step,
          statusBefore: counsellingScheduleChanges.statusBefore,
          by: accounts.studentId,
          byAccount: accounts.id,
        })
        .from(counsellingScheduleChanges)
        .innerJoin(
          accounts,
          eq(accounts.id, counsellingScheduleChanges.changedBy),
        )
        .orderBy(asc(counsellingScheduleChanges.changedAt));

      expect(schedules).toHaveLength(
        SAMPLE_SCHEDULES.length + SAMPLE_ASSIGNMENTS.length,
      );
      for (const sample of SAMPLE_SCHEDULES) {
        const status = sample.steps.at(-1)?.statusAfter;
        const schedule = schedules.find(
          (each) =>
            each.nim === sample.nim &&
            each.status === status &&
            each.kind === "voluntary",
        );
        expect(schedule).toBeDefined();
        expect(isWeekday(schedule?.day ?? "")).toBe(true);
        expect((schedule?.day ?? "") > today).toBe(sample.inDays > 0);
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

      const senders = {
        assigned: await sampleAccountOf(db, "discipline_officer"),
        called: await sampleAccountOf(db, "assessor"),
      };
      for (const sample of SAMPLE_ASSIGNMENTS) {
        const status = sample.steps.at(-1)?.statusAfter;
        const schedule = schedules.find(
          (each) => each.nim === sample.nim && each.kind === sample.kind,
        );
        expect(schedule).toMatchObject({ status, basis: sample.basis });
        expect(schedule?.penaltyId !== null, sample.nim).toBe(
          sample.fromPenalty,
        );
        if (sample.fromPenalty) {
          expect(schedule?.penaltyOf).toBe(schedule?.studentId);
        }
        if (sample.time === null) expect(schedule?.day).toBeNull();
        else expect(isWeekday(schedule?.day ?? "")).toBe(true);
        const own = lines.filter((line) => line.scheduleId === schedule?.id);
        expect(own.map((line) => line.step)).toEqual(
          sample.steps.map((step) => step.step),
        );
        expect(own[0]?.byAccount).toBe(senders[sample.kind]);
        expect(own.map((line) => line.by !== null)).toEqual(
          sample.steps.map((step) => isStudentScheduleStep(step.step)),
        );
        expect(schedule?.counsellorId !== null).toBe(status !== "awaiting");
      }
    });
  });
});
