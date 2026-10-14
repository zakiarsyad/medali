// Sample Tahun akademik of this file: 2440 to 2440.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import { academicPeriodChanges, academicPeriods, accounts } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

const ODD_2440 = {
  startYear: 2440,
  term: "odd",
  startsOn: "2440-08-01",
  endsOn: "2441-01-31",
} as const;

async function addLogLine(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji" })
    .returning();
  const [period] = await db
    .insert(academicPeriods)
    .values(ODD_2440)
    .returning();
  if (!account || !period) throw new Error("The records were not added.");
  const [line] = await db
    .insert(academicPeriodChanges)
    .values({
      periodId: period.id,
      changedBy: account.id,
      action: "added",
      startsOnAfter: period.startsOn,
      endsOnAfter: period.endsOn,
    })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

describe("the academic periods", () => {
  it("refuse a period that does not end after its start", async () => {
    await inTestDatabase(async (db) => {
      const added = db
        .insert(academicPeriods)
        .values({ ...ODD_2440, endsOn: ODD_2440.startsOn });
      await expect(added).rejects.toThrow();
    });
  });

  it("refuse the same year and term twice", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2440);
      const again = db
        .insert(academicPeriods)
        .values({ ...ODD_2440, startsOn: "2442-08-01", endsOn: "2443-01-31" });
      await expect(again).rejects.toThrow();
    });
  });

  it("refuse a period that starts on the last day of another", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2440);
      const overlapping = db.insert(academicPeriods).values({
        startYear: 2440,
        term: "even",
        startsOn: ODD_2440.endsOn,
        endsOn: "2441-07-31",
      });
      await expect(overlapping).rejects.toThrow();
    });
  });

  it("take a period that starts the day after another ends", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2440);
      await db.insert(academicPeriods).values({
        startYear: 2440,
        term: "even",
        startsOn: "2441-02-01",
        endsOn: "2441-07-31",
      });
      expect(await db.select().from(academicPeriods)).toHaveLength(2);
    });
  });
});

describe("the log of period changes", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const change = db
        .update(academicPeriodChanges)
        .set({ endsOnAfter: "2441-02-28" })
        .where(eq(academicPeriodChanges.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db);
      const removal = db
        .delete(academicPeriodChanges)
        .where(eq(academicPeriodChanges.id, id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db);
      await expect(
        db.execute(sql`truncate academic_period_changes`),
      ).rejects.toThrow();
    });
  });
});
