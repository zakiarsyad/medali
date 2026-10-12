import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import {
  SAMPLE_ACCOUNTS,
  SAMPLE_PPKS_ACTIVITIES,
  SAMPLE_STUDENTS,
} from "./sample-data";
import {
  academicPeriodChanges,
  academicPeriods,
  accounts,
  ppksActivities,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

describe("fillWithSampleData", () => {
  it("adds every sample student", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const added = await db.select({ nim: students.nim }).from(students);
      expect(added.map((student) => student.nim).sort()).toEqual(
        SAMPLE_STUDENTS.map((student) => student.nim).sort(),
      );
    });
  });

  it("adds the sample PPKS activities, changed by the sample Kepala Unit", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const added = await db
        .select({ name: ppksActivities.name, by: accounts.name })
        .from(ppksActivities)
        .innerJoin(accounts, eq(accounts.id, ppksActivities.changedBy));
      expect(added.map((activity) => activity.name).sort()).toEqual(
        SAMPLE_PPKS_ACTIVITIES.map((activity) => activity.name).sort(),
      );
      for (const activity of added) {
        expect(activity.by).toBe(SAMPLE_ACCOUNTS[0]?.name);
      }
    });
  });

  it("adds the period of today and the three before it, each in the log", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);

      const today = campusDay();
      const periods = await db.select().from(academicPeriods);
      expect(periods).toHaveLength(4);
      const running = periods.filter(
        (period) => period.startsOn <= today && today <= period.endsOn,
      );
      expect(running).toHaveLength(1);
      const earlier = periods.filter((period) => period.endsOn < today);
      expect(earlier).toHaveLength(3);

      const logged = await db
        .select({
          periodId: academicPeriodChanges.periodId,
          action: academicPeriodChanges.action,
          by: accounts.name,
        })
        .from(academicPeriodChanges)
        .innerJoin(accounts, eq(accounts.id, academicPeriodChanges.changedBy));
      expect(logged.map((line) => line.periodId).sort()).toEqual(
        periods.map((period) => period.id).sort(),
      );
      for (const line of logged) {
        expect(line.action).toBe("added");
        expect(line.by).toBe(SAMPLE_ACCOUNTS[0]?.name);
      }
    });
  });
});
