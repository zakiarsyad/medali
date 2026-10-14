// Sample Tahun akademik of this file: those of the app's sample data.
import { eq, isNotNull, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { levelOf } from "@/academic-periods/stages";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { sampleActivitySchedules } from "./sample-activity-schedules";
import { SAMPLE_ACCOUNTS, samplePeriods } from "./sample-data";
import { sampleExtraSchedules } from "./sample-extra-schedules";
import {
  accounts,
  activityScheduleParticipants,
  activitySchedules,
  ppksActivities,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, and it waits behind other checks that write the same tables.
describe("the sample activity schedules", { timeout: 20_000 }, () => {
  it("are all added, each of a PPKS activity, by the sample Kepala Unit, and none removed", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const today = campusDay();
      const samples = sampleActivitySchedules(today, samplePeriods(today));
      const added = await db
        .select({
          semester: ppksActivities.semester,
          by: accounts.name,
          deletedAt: activitySchedules.deletedAt,
        })
        .from(activitySchedules)
        .innerJoin(
          ppksActivities,
          eq(ppksActivities.id, activitySchedules.activityId),
        )
        .innerJoin(accounts, eq(accounts.id, activitySchedules.changedBy))
        .where(isNotNull(ppksActivities.semester));

      expect(samples.length).toBeGreaterThan(0);
      expect(added).toHaveLength(samples.length);
      for (const schedule of added) {
        expect(schedule.semester).not.toBeNull();
        expect(schedule.by).toBe(SAMPLE_ACCOUNTS[0]?.name);
        expect(schedule.deletedAt).toBeNull();
      }
      const levels = added.map(({ semester }) => levelOf(semester ?? 0));
      expect(new Set(levels).size).toBeGreaterThan(1);
    });
  });

  it("each keep the stored period that runs on their first day", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const periods = await readAcademicPeriods(db);
      const added = await db.select().from(activitySchedules);

      expect(added.length).toBeGreaterThan(0);
      for (const schedule of added) {
        const running = runningPeriodOn(periods, schedule.startsOn);

        expect(schedule.academicPeriodId).toBe(running?.id);
      }
    });
  });

  it("hold two of the special activities, each for the classes or angkatan it names", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const today = campusDay();
      const samples = sampleExtraSchedules(today, samplePeriods(today));
      const added = await db
        .select({ id: activitySchedules.id, name: ppksActivities.name })
        .from(activitySchedules)
        .innerJoin(
          ppksActivities,
          eq(ppksActivities.id, activitySchedules.activityId),
        )
        .where(isNull(ppksActivities.semester));
      const participants = await db
        .select({
          scheduleId: activityScheduleParticipants.scheduleId,
          className: activityScheduleParticipants.className,
          cohortYear: activityScheduleParticipants.cohortYear,
        })
        .from(activityScheduleParticipants);

      expect(added).toHaveLength(2);
      for (const sample of samples) {
        const schedule = added.find(
          (each) => each.name === sample.activityName,
        );
        const named = participants
          .filter((each) => each.scheduleId === schedule?.id)
          .map(({ className, cohortYear }) => className ?? cohortYear);
        const sampled = sample.participants.map((participant) =>
          "className" in participant
            ? participant.className
            : participant.cohortYear,
        );

        expect(named.sort()).toEqual(sampled.sort());
      }
    });
  });
});
