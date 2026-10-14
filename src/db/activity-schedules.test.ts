// Sample Tahun akademik of this file: 2100 to 2100.
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  academicPeriods,
  accounts,
  activitySchedules,
  ppksActivities,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

type Schedule = typeof activitySchedules.$inferInsert;

/** A schedule with nothing wrong in it, of a made-up activity and period. */
async function validSchedule(db: Database): Promise<Schedule> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel Jadwal" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  const changed = { changedAt: new Date(), changedBy: account.id };
  const [activity] = await db
    .insert(ppksActivities)
    .values({
      semester: 3,
      name: "Kegiatan uji tabel jadwal",
      valueKeys: ["M"],
      indicatorCodes: ["M2"],
      isRequired: true,
      description: "",
      ...changed,
    })
    .returning();
  // A Tahun akademik no other file of checks adds: two that add the same
  // one wait for each other.
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 2100,
      term: "odd",
      startsOn: "2100-08-01",
      endsOn: "2101-01-31",
    })
    .returning();
  if (!activity || !period) throw new Error("The records were not added.");
  return {
    activityId: activity.id,
    academicPeriodId: period.id,
    startsOn: "2100-09-10",
    endsOn: "2100-09-10",
    startTime: "07:30",
    endTime: "11:30",
    uploadCount: 1,
    uploadUnit: "day",
    location: "",
    isRequired: true,
    ...changed,
  };
}

describe("an activity schedule", () => {
  it("is kept when it lasts one day and its upload range is 0 or 52", async () => {
    await inTestDatabase(async (db) => {
      const schedule = await validSchedule(db);

      await db.insert(activitySchedules).values([
        { ...schedule, uploadCount: 0 },
        { ...schedule, uploadCount: 52, uploadUnit: "week" },
      ]);

      expect(await db.select().from(activitySchedules)).toHaveLength(2);
    });
  });

  it.each([
    ["that ends before its first day", { endsOn: "2100-09-09" }],
    ["whose last hour is its first hour", { endTime: "07:30" }],
    ["whose last hour is before its first hour", { endTime: "07:00" }],
    ["with an upload range below 0", { uploadCount: -1 }],
    ["with an upload range above 52", { uploadCount: 53 }],
  ])("is refused %s", async (_kind, wrong) => {
    await inTestDatabase(async (db) => {
      const schedule = await validSchedule(db);
      // In a transaction of its own, so the refusal does not end the check's.
      const adding = db.transaction((tx) =>
        tx.insert(activitySchedules).values({ ...schedule, ...wrong }),
      );

      await expect(adding).rejects.toThrow();
    });
  });
});
