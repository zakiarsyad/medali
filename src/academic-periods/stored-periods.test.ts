// Sample Tahun akademik of this file: 2450 to 2454.
import { describe, expect, it } from "vitest";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readAcademicPeriods, readRunningPeriod } from "./stored-periods";

const inTestDatabase = withTestDatabase();

const EVEN_2450 = {
  startYear: 2450,
  term: "even",
  startsOn: "2451-02-01",
  endsOn: "2451-07-15",
} as const;
const ODD_2451 = {
  startYear: 2451,
  term: "odd",
  startsOn: "2451-08-01",
  endsOn: "2452-01-31",
} as const;

describe("readAcademicPeriods", () => {
  it("lists the periods newest first", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([EVEN_2450, ODD_2451]);

      const periods = await readAcademicPeriods(db);

      expect(periods).toMatchObject([ODD_2451, EVEN_2450]);
    });
  });
});

describe("readRunningPeriod", () => {
  it("gives the stored period a day falls in", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([EVEN_2450, ODD_2451]);

      expect(await readRunningPeriod(db, "2451-10-12")).toMatchObject(ODD_2451);
    });
  });

  it("keeps the period that ended last between two periods", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([EVEN_2450, ODD_2451]);

      expect(await readRunningPeriod(db, "2451-07-20")).toMatchObject(
        EVEN_2450,
      );
    });
  });

  it("makes no period by itself after the last one ended", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([EVEN_2450, ODD_2451]);

      expect(await readRunningPeriod(db, "2453-03-01")).toMatchObject(ODD_2451);
      expect(await db.select().from(academicPeriods)).toHaveLength(2);
    });
  });

  it("says there is no period before the first one, or with none stored", async () => {
    await inTestDatabase(async (db) => {
      expect(await readRunningPeriod(db, "2451-10-12")).toBeNull();
      await db.insert(academicPeriods).values(ODD_2451);

      expect(await readRunningPeriod(db, "2451-07-31")).toBeNull();
    });
  });

  it("answers for today when no day is given", async () => {
    await inTestDatabase(async (db) => {
      // Today falls after a period only when its days are in the past,
      // so this one keeps past days under a year of this file.
      await db.insert(academicPeriods).values({
        startYear: 2454,
        term: "odd",
        startsOn: "2000-08-01",
        endsOn: "2001-01-31",
      });

      expect(await readRunningPeriod(db)).toMatchObject({ startYear: 2454 });
    });
  });
});
