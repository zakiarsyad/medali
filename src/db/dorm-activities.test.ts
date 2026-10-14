import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  dormActivities,
  dormActivityDaysOff,
  dormActivityVersions,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

type Version = typeof dormActivityVersions.$inferInsert;

interface Added {
  accountId: string;
  /** A daily version with nothing wrong in it, of an activity just added. */
  version: Version;
}

async function addActivity(db: Database): Promise<Added> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji Tabel Kegiatan Asrama" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  const [activity] = await db
    .insert(dormActivities)
    .values({ changedAt: new Date(), changedBy: account.id })
    .returning();
  if (!activity) throw new Error("The activity was not added.");
  const version: Version = {
    activityId: activity.id,
    name: "Apel uji tabel",
    category: "roll_call",
    location: "",
    pattern: "daily",
    weekdays: [],
    startsOn: "2100-09-01",
    startTime: "05:30",
    endTime: "06:15",
    organiser: "bam",
    organiserName: "",
    audience: "all",
    isRequired: true,
    rundown: [{ time: "05:30", activity: "Apel" }],
  };
  return { accountId: account.id, version };
}

/** In a transaction of its own, so a refusal does not end the check's. */
function adding(db: Database, version: Version) {
  return db.transaction((tx) =>
    tx.insert(dormActivityVersions).values(version),
  );
}

describe("a version of a dorm activity", () => {
  it("is kept daily, weekly, monthly and once, with its rincian as it was given", async () => {
    await inTestDatabase(async (db) => {
      const { version } = await addActivity(db);
      const ended = { ...version, shownUntil: "2100-09-30" };

      await db.insert(dormActivityVersions).values([
        { ...ended, shownFrom: "2100-09-01", shownUntil: "2100-09-10" },
        {
          ...ended,
          shownFrom: "2100-09-11",
          shownUntil: "2100-09-20",
          pattern: "weekly",
          weekdays: [0, 6],
        },
        {
          ...ended,
          shownFrom: "2100-09-21",
          pattern: "monthly",
          monthDay: 28,
        },
        { ...version, pattern: "once", endsOn: "2100-09-01" },
      ]);

      const kept = await db.select().from(dormActivityVersions);
      expect(kept).toHaveLength(4);
      expect(kept[0]?.rundown).toEqual([{ time: "05:30", activity: "Apel" }]);
    });
  });

  it.each<[string, Partial<Version>]>([
    ["whose last hour is its first hour", { endTime: "05:30" }],
    ["that ends before it starts", { endsOn: "2100-08-31" }],
    [
      "shown until a day before the first it is shown",
      { shownFrom: "2100-09-10", shownUntil: "2100-09-09" },
    ],
    ["once on more than one day", { pattern: "once", endsOn: "2100-09-02" }],
    ["once with no last day", { pattern: "once" }],
    ["weekly with no day", { pattern: "weekly" }],
    ["daily with a day of the week", { weekdays: [1] }],
    ["weekly on a day 7", { pattern: "weekly", weekdays: [7] }],
    ["monthly with no date", { pattern: "monthly" }],
    ["monthly on the 29th", { pattern: "monthly", monthDay: 29 }],
    ["monthly on the 0th", { pattern: "monthly", monthDay: 0 }],
    ["daily with a date of the month", { monthDay: 1 }],
  ])("is refused %s", async (_kind, wrong) => {
    await inTestDatabase(async (db) => {
      const { version } = await addActivity(db);

      await expect(adding(db, { ...version, ...wrong })).rejects.toThrow();
    });
  });

  it("is refused as a second one without a last day for one activity", async () => {
    await inTestDatabase(async (db) => {
      const { version } = await addActivity(db);
      await db.insert(dormActivityVersions).values(version);

      await expect(adding(db, version)).rejects.toThrow();
    });
  });
});

describe("a dorm activity", () => {
  it("is refused a removal mark that lacks who, when or from which day", async () => {
    await inTestDatabase(async (db) => {
      const { accountId } = await addActivity(db);
      const half = db.transaction((tx) =>
        tx.update(dormActivities).set({ deletedAt: new Date() }),
      );
      await expect(half).rejects.toThrow();

      await db.update(dormActivities).set({
        deletedAt: new Date(),
        deletedBy: accountId,
        removedFrom: "2100-09-05",
      });
      const [marked] = await db.select().from(dormActivities);
      expect(marked?.removedFrom).toBe("2100-09-05");
    });
  });

  it("is refused the same day off twice", async () => {
    await inTestDatabase(async (db) => {
      const { version } = await addActivity(db);
      const dayOff = { activityId: version.activityId, day: "2100-09-05" };
      await db.insert(dormActivityDaysOff).values(dayOff);

      const again = db.transaction((tx) =>
        tx.insert(dormActivityDaysOff).values(dayOff),
      );
      await expect(again).rejects.toThrow();
    });
  });
});
